# regexsolver.com

The [regexsolver.com](https://regexsolver.com) website and its live demo. The
demo runs [regexsolver](https://github.com/RegexSolver/regexsolver) in the
browser, compiled to WebAssembly: nothing is sent to a server.

- `wasm/`: the demo's engine, a thin `wasm-bindgen` wrapper around the
  `regexsolver` crate, with neural synthesis to turn automata into short
  regexes (model: [`alexvbrdn/kleene2-5m-b16-t128`](https://huggingface.co/alexvbrdn/kleene2-5m-b16-t128),
  fetched from the Hugging Face Hub by the browser).
- `site/`: the Next.js static export. `public/engine/worker.js` runs the engine
  in a Web Worker; `src/lib/engine.ts` is the page side.
- `web-shared/`: brand assets, fonts, consent, analytics and site links.

## Develop

Needs Rust with the `wasm32-unknown-unknown` target, the `wasm-bindgen` CLI at
the version `wasm/Cargo.toml` pins, and Node.js 22.

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.130
cd site
npm ci
npm run build:wasm   # engine -> public/engine/pkg/
npm run dev
```

## Deploy

Every push to `main` builds and publishes to GitHub Pages
(`.github/workflows/deploy.yml`).
