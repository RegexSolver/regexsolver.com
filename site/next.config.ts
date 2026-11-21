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
  // "" on regexsolver.com, "/regexsolver.com" for the github.io preview
  // (src/lib/basePath.ts).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: repoRoot,
  },
  // @regexsolver/web-shared ships raw TypeScript (../web-shared, file: dep).
  transpilePackages: ["@regexsolver/web-shared"],
};

export default nextConfig;
