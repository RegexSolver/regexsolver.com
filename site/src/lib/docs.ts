// The crate's API documentation on docs.rs. `Link` treats the absolute URL as
// external (opens in a new tab).
import { DOCS_URL } from "@regexsolver/web-shared/site-links";

export { CRATE_URL, GITHUB_URL } from "@regexsolver/web-shared/site-links";

const BASE = `${DOCS_URL}/latest/regexsolver/`;

/** A docs.rs page of the crate, e.g. docs("enum.Term.html#method.union"). */
export const docs = (path = "") => `${BASE}${path}`;

/** The crate's docs.rs home at one version, e.g. docsAt("1.3.1"). */
export const docsAt = (version: string) =>
  `${DOCS_URL}/${version}/regexsolver/`;
