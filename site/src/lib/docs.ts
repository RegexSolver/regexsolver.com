// Pages like /quickstart, /privacy, /terms, /plans-pricing live on the docs site
// (Zudoku), not on this landing app. Their host is baked at build time via
// NEXT_PUBLIC_DOCS_URL (set per environment in rs-website.Dockerfile / CI), e.g.
// https://docs.regexsolver.com (prod) or https://docs.dev.regexsolver.com (dev).
//
// When unset (local dev) it falls back to a relative path, matching the previous
// behaviour. `Link` treats the resulting absolute URL as external (opens in a new tab).
const DOCS_BASE = process.env.NEXT_PUBLIC_DOCS_URL ?? "";

/** Build a link to a docs-site page, e.g. docs("/quickstart"). */
export const docs = (path: string) => `${DOCS_BASE}${path}`;
