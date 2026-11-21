/* The path the site is served under: "" on regexsolver.com, "/regexsolver.com"
   for the preview on regexsolver.github.io (the deploy workflow sets it, see
   DEPLOY_TARGET). Next prefixes its own assets and next/link hrefs with it
   (next.config.ts basePath); `asset` prefixes the paths written by hand. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A root-relative path to a public file, under the base path. */
export const asset = (path: string) => `${BASE_PATH}${path}`;
