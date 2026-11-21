// The crate's API documentation on docs.rs. `Link` treats the absolute URL as
// external (opens in a new tab).
import { DOCS_URL } from "@regexsolver/web-shared/site-links";

export { CRATE_URL, GITHUB_URL } from "@regexsolver/web-shared/site-links";

const BASE = `${DOCS_URL}/latest/regexsolver/`;

/** A docs.rs page of the crate, e.g. docs("enum.Term.html#method.union"). */
export const docs = (path = "") => `${BASE}${path}`;
