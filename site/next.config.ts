import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import path from "node:path";

// @regexsolver/web-shared lives at ../web-shared (sibling dir, file: dep).
// Turbopack otherwise infers this app dir as its root and won't transpile a
// symlinked package whose real files sit outside it — point root at the repo.
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: repoRoot,
  },
  // @regexsolver/web-shared ships raw TypeScript (apps/web-shared, file: dep).
  transpilePackages: ["@regexsolver/web-shared"],
};

export default nextConfig;
