/* The live demo's engine, run off the main thread so a long operation never
   blocks the page. Served as is (not bundled): it imports the wasm-bindgen
   glue that `npm run build:wasm` writes to ./pkg/. The page talks to it
   through src/lib/engine.ts, which starts it as worker.js?v=<version>: the
   same query is put on the glue and the WebAssembly, so a deploy never pairs
   this worker with files a browser cached from the previous one.

   Messages in:  { type: "preload" } — load the engine ahead of the first run
                 { id, request, model? } — request is the demo form's JSON;
                   model ({ name, url }) is the neural synthesis model its
                   `format` names, loaded first
   Messages out: { type: "progress", model, loaded, total } — a model download
                 { id, status: "running" } — the operation itself has started
                 { id, data } | { id, error, unavailable? } */

const version = self.location.search;
// Also read by src/lib/engine.ts (cachedModels).
const MODEL_CACHE = "regexsolver-models-v1";

const engine = import(`./pkg/regexsolver_demo.js${version}`).then(
  async (glue) => {
    await glue.default({
      module_or_path: new URL(
        `./pkg/regexsolver_demo_bg.wasm${version}`,
        import.meta.url,
      ),
    });
    return glue;
  },
);

/* The Hub redirects to a signed CDN URL that changes, so the browser's HTTP
   cache rarely hits: keep the files in the Cache API, keyed by their pinned
   Hub URL. Without it (private windows on some browsers), just download.
   `onProgress(loaded, total)` follows the download. */
async function fetchCached(url, onProgress) {
  let cache = null;
  try {
    cache = await caches.open(MODEL_CACHE);
    const hit = await cache.match(url);
    if (hit) return new Uint8Array(await hit.arrayBuffer());
  } catch {
    cache = null;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const total = Number(response.headers.get("content-length")) || 0;
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total);
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  if (cache) await cache.put(url, new Response(bytes)).catch(() => {});
  return bytes;
}

const models = new Map();

function ensureModel({ name, url }) {
  if (!models.has(name)) {
    const loading = (async () => {
      const { loadModel } = await engine;
      const [config, weights] = await Promise.all([
        fetchCached(url + "config.json"),
        fetchCached(url + "model.safetensors", (loaded, total) =>
          self.postMessage({ type: "progress", model: name, loaded, total }),
        ),
      ]);
      loadModel(name, config, weights);
    })();
    // A failed download can be retried.
    loading.catch(() => models.delete(name));
    models.set(name, loading);
  }
  return models.get(name);
}

self.onmessage = async ({ data }) => {
  if (data.type === "preload") {
    engine.catch(() => {});
    return;
  }
  const { id, request, model } = data;
  let run;
  try {
    ({ run } = await engine);
  } catch (err) {
    self.postMessage({
      id,
      error: `The engine failed to load: ${err?.message ?? err}`,
      unavailable: true,
    });
    return;
  }
  if (model) {
    try {
      await ensureModel(model);
    } catch (err) {
      self.postMessage({
        id,
        error: `The model ${model.name} failed to download: ${err?.message ?? err}`,
        unavailable: true,
      });
      return;
    }
  }
  self.postMessage({ id, status: "running" });
  try {
    self.postMessage({ id, data: JSON.parse(run(request)) });
  } catch (err) {
    self.postMessage({ id, error: String(err?.message ?? err) });
  }
};
