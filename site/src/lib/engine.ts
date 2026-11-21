/* The page side of the live demo's engine: regexsolver compiled to
   WebAssembly, running in a Web Worker (public/engine/worker.js). Everything
   is computed in the browser; nothing is sent anywhere.

   One worker serves every caller on the page. An operation that outlives
   RUN_TIMEOUT_MS is cut short by terminating the worker: the engine checks
   its own timeout between steps, this catches a step that runs away. The next
   call starts a fresh worker. */

import { ENGINE_VERSION } from "./engineVersion";
import { type Model, modelUrl } from "./models";

export type EngineResult = { type: string; value: unknown };

/* The worker, its WebAssembly or a model could not be loaded: unlike an
   engine error, retrying the same inputs may succeed. */
export class EngineUnavailableError extends Error {}

/* Longer than the engine's own timeout (EXECUTION_TIMEOUT_MS in wasm/src/lib.rs),
   counted from when the operation starts, not while the model downloads. */
const RUN_TIMEOUT_MS = 15_000;

type Pending = {
  resolve: (result: EngineResult) => void;
  reject: (err: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
};

export type ModelProgress = { model: string; loaded: number; total: number };

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();
const progressListeners = new Set<(progress: ModelProgress) => void>();

/* Follows model downloads; returns the unsubscribe function. */
export function onModelProgress(listener: (progress: ModelProgress) => void) {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
}

function failAll(err: Error) {
  for (const { reject, timer } of pending.values()) {
    clearTimeout(timer);
    reject(err);
  }
  pending.clear();
}

function getWorker(): Worker {
  if (worker) return worker;
  // The version keeps a browser from mixing files of two deploys
  // (scripts/build-wasm.mjs).
  const created = new Worker(`/engine/worker.js?v=${ENGINE_VERSION}`, {
    type: "module",
  });
  created.onmessage = ({ data }) => {
    if (data.type === "progress") {
      progressListeners.forEach((listener) => listener(data));
      return;
    }
    const entry = pending.get(data.id);
    if (!entry) return;
    if (data.status === "running") {
      entry.timer = setTimeout(() => {
        // Terminating drops every queued operation with it.
        created.terminate();
        if (worker === created) worker = null;
        failAll(new Error("The operation took too much time."));
      }, RUN_TIMEOUT_MS);
      return;
    }
    clearTimeout(entry.timer);
    pending.delete(data.id);
    if (data.error !== undefined) {
      entry.reject(
        data.unavailable
          ? new EngineUnavailableError(data.error)
          : new Error(data.error),
      );
    } else {
      entry.resolve(data.data);
    }
  };
  created.onerror = (event) => {
    event.preventDefault();
    created.terminate();
    if (worker === created) worker = null;
    failAll(
      new EngineUnavailableError(
        `The engine failed to load${event.message ? `: ${event.message}` : "."}`,
      ),
    );
  };
  worker = created;
  return created;
}

let preloaded: Worker | null = null;

/* Starts the worker and its WebAssembly ahead of the first operation. Cheap
   to call again: it only asks once per worker. */
export function preloadEngine() {
  if (typeof Worker === "undefined") return;
  const current = getWorker();
  if (preloaded === current) return;
  preloaded = current;
  current.postMessage({ type: "preload" });
}

/* Runs one operation of the demo form; `request` is its JSON
   ({operation, regex1, regex2?, min?, max?, limit?, offset?, pathOrder?,
   characterOrder?, format?}). `model` is the model `format` names: the worker
   downloads it first, reporting through onModelProgress. Rejects with the
   engine's message on failure. */
export function compute(request: string, model?: Model): Promise<EngineResult> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({
      id,
      request,
      model: model && { name: model.name, url: modelUrl(model) },
    });
  });
}

/* The models the browser holds already (the worker's Cache API store). */
export async function cachedModels(models: Model[]): Promise<Set<string>> {
  const cached = new Set<string>();
  try {
    const cache = await caches.open("regexsolver-models-v1");
    for (const model of models) {
      if (await cache.match(modelUrl(model) + "model.safetensors"))
        cached.add(model.name);
    }
  } catch {
    // No Cache API (private windows on some browsers): nothing is kept.
  }
  return cached;
}

/* An error's kind, for analytics: the message up to its first colon. Syntax
   errors quote the pattern after it, and patterns never leave the browser. */
export const errorKind = (message: string) => message.split(":")[0];
