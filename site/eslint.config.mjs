import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/* Replaces `next lint`, which Next 16 removed — and which exits 0 even while
   erroring, so `npm run lint` looked alive long after it stopped working.
   eslint-config-next ships native flat configs; no FlatCompat needed. */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    // public/engine/pkg/ is wasm-bindgen output (npm run build:wasm).
    ignores: [".next/", "out/", "node_modules/", "next-env.d.ts", "public/engine/pkg/"],
  },
];

export default config;
