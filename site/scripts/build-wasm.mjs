#!/usr/bin/env node
/* Builds the live demo's engine (../wasm, regexsolver compiled to
   WebAssembly) and writes its wasm-bindgen glue to public/engine/pkg/, where
   public/engine/worker.js imports it. Needs the wasm32-unknown-unknown target
   and the wasm-bindgen CLI at the version wasm/Cargo.toml pins; runs wasm-opt
   (binaryen) too when it is installed. */

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const crate = join(site, "..", "wasm");
const out = join(site, "public", "engine", "pkg");
const run = (cmd, args, cwd = site) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit" });

run("cargo", ["build", "--release", "--locked"], crate);
run("wasm-bindgen", [
  "--target", "web",
  "--no-typescript",
  "--out-dir", out,
  join(crate, "target", "wasm32-unknown-unknown", "release", "regexsolver_demo.wasm"),
]);

const wasm = join(out, "regexsolver_demo_bg.wasm");
try {
  run("wasm-opt", ["-O3", "--enable-bulk-memory", "--enable-nontrapping-float-to-int", "--enable-sign-ext", "--enable-mutable-globals", "--enable-reference-types", "--enable-multivalue", wasm, "-o", wasm]);
} catch (err) {
  if (err.code !== "ENOENT") throw err;
  console.warn("build-wasm: wasm-opt not found, skipping the size pass");
}
