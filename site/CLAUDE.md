# site — regexsolver.com: the library's home page and live demo (Next.js static export)

The home page of the regexsolver Rust crate, kept minimal in the manner of an open-source library's site: `/` (what it is, install, the demo inline, one example, use cases, semantics), `/demo/` (the demo alone, shareable by URL) and `/privacy/`. A fully static export (`output: "export"`), served by GitHub Pages. There is no server: the demo runs the engine in the browser. Everything deeper lives on docs.rs.

## Layout
- `next.config.ts` — `output:"export"`, `trailingSlash`, `images.unoptimized`; `turbopack.root` is the repo root so the sibling `../web-shared` (raw-TS `file:` dep) is transpiled
- `src/app/**/page.tsx` — thin wrappers rendering a `views/` component plus their own `metadata`. `layout.tsx` holds the shared `metadata` (`metadataBase` resolves every relative canonical/`og:image`) and the JSON-LD `Organization`/`WebSite`/`SoftwareApplication` graph
- `src/app/{sitemap,robots}.ts` — `force-static`, emitted into `out/`
- `src/components/Page.tsx` — every page's frame: `Header` (wordmark, three links, theme switch; no menu, it fits a phone), one `max-w-3xl` column, `Footer` (one row of links). Link content is `web-shared/src/site-links.ts`
- `src/views/{LandingPage,DemoPage,Privacy,NotFound}.tsx` — the pages. `LandingPage` takes the crate's README (`regexsolver/README.md`) wording: intro, example, use cases, semantics. When the README changes, change the page with it
- Copy: short, plain sentences. Cut adverbs that carry no meaning ("always", "simply", "also"…); keep the ones that do ("exactly one")
- `src/components/Demo.tsx` — the demo: operation, patterns, result, and a collapsed "same call in Rust". Combine and Build operations return a term, shown as chosen in RESULT AS (`format`): the graph of its minimal automaton, a pattern by state elimination, or a pattern by one of the models. A model downloads on first use, with its progress in the readout; the select marks the ones the browser holds already
- `src/lib/models.ts` — the neural synthesis models the demo offers (name, pinned Hub commit, size). The one list: the select, the worker's download URLs and the Rust snippet all read it. Add a model here when the crate's README lists a new one
- `Demo`'s `syncUrl` (the /demo/ page) reads and writes `?op=…&a=…&b=…&format=…` and loads the engine on arrival; without it (home page) the engine loads when the visitor first focuses or hovers the form
- `src/lib/engine.ts` + `public/engine/worker.js` — the demo's engine (see "The engine")
- `src/lib/generateCode.ts` — `generateFullSnippet` (the demo's Rust program, generated from its payload) and `generateLandingSnippet` (the home page's example: the README's, then neural synthesis), in the README's idiom (`let a: Term = "…".parse()?`, `a.intersection([&b])`). The example shows both conversions back to a pattern, `to_pattern` (state elimination) then `to_pattern_with` (neural synthesis), each with a one-line comment. The demo's program follows its `format` (`to_dot` of the minimized automaton, `to_pattern`, or `to_pattern_with` and the chosen model), with no comment block. **Printed results come from compiling and running the snippets against the crate**; re-run them after an edit (a scratch crate with `regexsolver = { version = "1.3.0", features = ["neural-synthesis"] }`, swapping `from_hub` for `from_dir` on a local model). `rustTab(code)` builds the `CustomCodeTabs` tabs
- `src/lib/docs.ts` — `docs(path)`: a docs.rs page of the crate (`docs("enum.Term.html#method.union")`)
- `src/components/DotGraph.tsx` — renders the `dot` result with a lazily imported `@viz-js/viz`
- `src/lib/posthog.ts` + `instrumentation-client.ts` — PostHog (EU), cookieless by default, `localStorage+cookie` once the consent cookie is `accepted` (logic in web-shared). Off on local hostnames. Guard every `posthog.capture` on `analyticsEnabled`, and **never send pattern text**: error messages go through `errorKind()` (syntax errors quote the pattern), and the privacy policy promises this
- `src/views/Privacy.tsx` — the privacy policy. Keep it in step with what the site does (hosts it is served from and downloads from, when the model downloads, analytics, storage)
- `src/index.css` — design tokens (two inks and their overlap, see its header) and the Prism token colours
- `src/lib/basePath.ts` — `BASE_PATH` (`NEXT_PUBLIC_BASE_PATH`): `""` on regexsolver.com, `/regexsolver.com` for the preview on regexsolver.github.io. Next prefixes its assets and `next/link` hrefs (`basePath` in `next.config.ts`); **every root-relative path written by hand goes through `asset()`** (the worker URL, favicons, the manifest link, font preloads). Paths inside `public/site.webmanifest` are relative instead. The deploy workflow's `DEPLOY_TARGET` (`preview` or `production`) sets it, with the site URL, cookie domain and analytics
- `public/CNAME` — the custom domain (with an Actions deployment, the domain itself is set in the repo's Pages settings). `public/.gitignore` ignores `*` (brand assets are synced from web-shared at prebuild), so every committed public file has its own `!` line
- `public/7dfa2483f6057cb87aa0cbec916d71cb.txt` — IndexNow key file; the deploy job pings IndexNow with `web-shared/scripts/indexnow.mjs` after each deploy

## The engine
- `../wasm` is a `wasm-bindgen` crate wrapping `regexsolver` (crates.io, `neural-synthesis` on, `parallel` off). `run(json)` takes the demo form's JSON (`{operation, regex1, regex2?, min?, max?, limit?, offset?, pathOrder?, characterOrder?}`, operations as in `Demo.tsx`'s `OPS`) and returns `{type, value}`; it runs under an `ExecutionProfile` (10 s, 20,000 states) whose clock is `performance.now()`. A request's `format` is `"automaton"` (the minimal automaton's DOT), `"state_elimination"` (the default) or a model name; `loadModel(name, config, weights)` loads a model under that name, and asking for one not loaded is an error
- `npm run build:wasm` (`scripts/build-wasm.mjs`) builds it and writes the glue to `public/engine/pkg/` (gitignored), then `src/lib/engineVersion.ts` (gitignored): a hash of the worker and the engine. `engine.ts` starts `worker.js?v=<hash>` and the worker puts the same query on the glue and the `.wasm`, so a browser that cached the previous deploy (GitHub Pages: 10 minutes) never mixes the two. Needs the `wasm32-unknown-unknown` target and the `wasm-bindgen` CLI at the exact version `wasm/Cargo.toml` pins; runs `wasm-opt` when installed. Run it before `dev`/`build`
- `public/engine/worker.js` is served as is, not bundled: a module worker importing `./pkg/regexsolver_demo.js` dynamically (with its version query). A request comes with the model its `format` names (`{name, url}`, from `models.ts`): the worker downloads it from the Hugging Face Hub, streaming `{type: "progress", model, loaded, total}`, keeps it in the Cache API (`regexsolver-models-v1`, also read by `cachedModels`) and loads it. It posts `{id, status: "running"}` when the operation starts, then `{id, data}` or `{id, error}`
- `src/lib/engine.ts` owns one worker per page. `compute(json, model?)` resolves with `{type, value}`; `onModelProgress` follows downloads; an operation running past 15 s terminates the worker (the next call starts a new one). `EngineUnavailableError` means the worker or WASM failed to load: callers do not cache that answer, so a retry goes through
- `wasm/.cargo/config.toml` selects `getrandom`'s `wasm_js` backend (candle pulls `getrandom` 0.4 through `zip`, which enables it); the `getrandom_02`/`getrandom_03` dependencies select it for the other versions in the tree

## Conventions
- Keep `app/**/page.tsx` thin; UI in `views/` + `components/`. Stateful components need `"use client"`.
- Navigate with the local `<Link to=...>` (`components/ui/Link`): internal links go through `next/link`, `http`/`//` ones become `<a target=_blank rel=noopener>`.
- Browser config via `NEXT_PUBLIC_*` only, inlined at build time (`.env.example`; the deploy workflow sets prod values).
- **URLs in metadata carry the trailing slash** (`/demo/`). A new page = its `metadata` (with `alternates.canonical`), a `<JsonLd data={breadcrumb(...)}/>`, a row in `src/app/sitemap.ts`, and `<Page>` around its view; `openGraph` comes from `og(...)` in `src/lib/seo.ts` (Next does not deep-merge `openGraph`) and the share image from `OG_IMAGE`.
- Minimal on purpose: no feature pages, FAQ or marketing sections. Prefer a line on the home page or a docs.rs link to a new page. Every capability the copy names is one the crate documents.
- `src/index.css` declares `@source "../node_modules/@regexsolver/web-shared/src"` — without it the cookie banner loses its Tailwind classes.
- **Never add react/react-dom to tsconfig `paths`**: Turbopack applies them at runtime and the build breaks.
- Style with the Tailwind v4 token utilities from `index.css @theme` and the `dark:` variant — never raw colors.

## Gotchas
- Static export: no SSR/ISR/route handlers/middleware, and GitHub Pages cannot redirect or set headers. Old URLs (`/pricing/`, `/terms`, the three feature pages) now 404 onto `404.html`.
- `app/not-found.tsx` sets `robots` and `alternates.canonical` to `null` on purpose: omitting them inherits the layout's `index, follow` and `canonical: "/"` next to Next's own `noindex`.
- Fonts are self-hosted: the prebuild sync-brand step copies the woff2 to `public/fonts/` and writes `src/app/fonts.css` (gitignored), web-shared's `fonts.css` with the base path in its root-absolute `url()`s, which `app/layout.tsx` imports. An external `@import url(...)` in `index.css` is silently dropped by Turbopack. The latin faces are preloaded with `ReactDOM.preload` (a literal `<link>` gets emitted twice).
- `ThemeProvider` reads the theme after mount; a pre-hydration inline script in `layout.tsx` applies `.dark` first (cookie → localStorage → OS). Keep the two in sync; `<html>` has `suppressHydrationWarning`.
- `CodeBlock` only loads Prism's Rust grammar.

## Commands
```bash
npm ci
npm run build:wasm # engine → public/engine/pkg/
npm run dev        # next dev
npm run build      # next build → static export in out/
npm run lint       # eslint . (flat config; `next lint` no longer exists)
npm run typecheck  # tsc --noEmit
```
