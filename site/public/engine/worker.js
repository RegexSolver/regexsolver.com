/* The live demo's engine, run off the main thread so a long operation never
   blocks the page. Served as is (not bundled): it imports the wasm-bindgen
   glue that `npm run build:wasm` writes to ./pkg/. The page talks to it
   through src/lib/engine.ts.

   Messages in:  { id, request }  — request is the demo form's JSON string
                 { type: "preload" } — start fetching the model early
   Messages out: { id, status: "running" } — the operation itself has started
                 { id, data } | { id, error, unavailable? } */

import init, { loadModel, run } from "./pkg/regexsolver_demo.js";

/* The neural synthesis model that turns the automata compute operations
   return into short regexes. Pinned to a commit so a model update cannot
   change the demo's answers unannounced. CORS-enabled on the Hub. */
const MODEL_URL =
  "https://huggingface.co/alexvbrdn/kleene2-5m-b16-t128/resolve/8005e30a59c07dc721caba63c7ef67df99aa1ea7/";
const MODEL_CACHE = "regexsolver-model-v1";

/* The operations whose result is a regex: the only ones the model helps. */
const COMPUTE_OPERATIONS = new Set([
  "concat",
  "union",
  "intersection",
  "difference",
  "complement",
  "repeat",
]);

const engine = init();
let model = null;

/* The Hub redirects to a signed CDN URL that changes, so the browser's HTTP
   cache rarely hits: keep the files in the Cache API, keyed by their pinned
   Hub URL. Without it (private windows on some browsers), just download. */
async function fetchCached(url) {
  let cache = null;
  try {
    cache = await caches.open(MODEL_CACHE);
    const hit = await cache.match(url);
    if (hit) return new Uint8Array(await hit.arrayBuffer());
  } catch {
    cache = null;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  if (cache) await cache.put(url, response.clone()).catch(() => {});
  return new Uint8Array(await response.arrayBuffer());
}

function ensureModel() {
  model ??= (async () => {
    await engine;
    const [config, weights] = await Promise.all([
      fetchCached(MODEL_URL + "config.json"),
      fetchCached(MODEL_URL + "model.safetensors"),
    ]);
    loadModel(config, weights);
  })();
  return model;
}

self.onmessage = async ({ data }) => {
  if (data.type === "preload") {
    ensureModel().catch(() => {});
    return;
  }
  const { id, request } = data;
  try {
    await engine;
  } catch (err) {
    self.postMessage({ id, error: String(err?.message ?? err), unavailable: true });
    return;
  }
  /* Without the model, compute operations still answer, with state
     elimination's longer regexes. */
  if (COMPUTE_OPERATIONS.has(JSON.parse(request).operation)) {
    await ensureModel().catch(() => {});
  }
  self.postMessage({ id, status: "running" });
  try {
    self.postMessage({ id, data: JSON.parse(run(request)) });
  } catch (err) {
    self.postMessage({ id, error: String(err?.message ?? err) });
  }
};
