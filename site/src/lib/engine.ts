/* The page side of the live demo's engine: regexsolver compiled to
   WebAssembly, running in a Web Worker (public/engine/worker.js). Everything
   is computed in the browser; nothing is sent anywhere.

   One worker serves every caller on the page. An operation that outlives
   RUN_TIMEOUT_MS is cut short by terminating the worker: the engine checks
   its own timeout between steps, this catches a step that runs away. The next
   call starts a fresh worker. */

export type EngineResult = { type: string; value: unknown };

/* The worker or its WebAssembly could not be loaded: unlike an engine error,
   retrying the same inputs may succeed. */
export class EngineUnavailableError extends Error {}

/* Longer than the engine's own timeout (EXECUTION_TIMEOUT_MS in wasm/src/lib.rs),
   counted from when the operation starts, not while the model downloads. */
const RUN_TIMEOUT_MS = 15_000;

type Pending = {
  resolve: (result: EngineResult) => void;
  reject: (err: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
};

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

function failAll(err: Error) {
  for (const { reject, timer } of pending.values()) {
    clearTimeout(timer);
    reject(err);
  }
  pending.clear();
}

function getWorker(): Worker {
  if (worker) return worker;
  const created = new Worker("/engine/worker.js", { type: "module" });
  created.onmessage = ({ data }) => {
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
          ? new EngineUnavailableError(`The engine failed to load: ${data.error}`)
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

/* Starts the worker and the model download ahead of the first operation. */
export function preloadEngine() {
  if (typeof Worker === "undefined") return;
  getWorker().postMessage({ type: "preload" });
}

/* Runs one operation of the demo form; `request` is its JSON
   ({operation, regex1, regex2?, min?, max?, limit?, offset?, pathOrder?,
   characterOrder?}). Rejects with the engine's message on failure. */
export function compute(request: string): Promise<EngineResult> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, request });
  });
}
