/**
 * The header and footer links. Website paths carry the trailing slash (Next
 * static export with `trailingSlash`). External links are absolute URLs and
 * open in a new tab; labels carry a literal ↗ like the rest of the UI.
 */

export type SiteLink = {
  label: string;
  /** Where `path` lives: on this site (a root-relative path) or elsewhere. */
  site: "website" | "external";
  path: string;
};

/** True when the link should open in a new tab. */
export const isExternalSiteLink = (link: SiteLink): boolean =>
  link.site === "external";

/** The crate's API documentation, which the Docs links point at. */
export const DOCS_URL = "https://docs.rs/regexsolver";
export const GITHUB_URL = "https://github.com/RegexSolver/regexsolver";
export const CRATE_URL = "https://crates.io/crates/regexsolver";

/** Header links, in display order. */
export const NAV_ITEMS: SiteLink[] = [
  { label: "Demo", site: "website", path: "/demo/" },
  { label: "Docs ↗", site: "external", path: DOCS_URL },
  { label: "GitHub ↗", site: "external", path: GITHUB_URL },
];

/** Footer links, in display order. */
export const FOOTER_LINKS: SiteLink[] = [
  { label: "GitHub ↗", site: "external", path: GITHUB_URL },
  { label: "crates.io ↗", site: "external", path: CRATE_URL },
  { label: "docs.rs ↗", site: "external", path: DOCS_URL },
  {
    label: "Issues ↗",
    site: "external",
    path: "https://github.com/RegexSolver/regexsolver/issues",
  },
  { label: "Privacy", site: "website", path: "/privacy/" },
];

export const COPYRIGHT = `MIT LICENSED · © ${new Date().getFullYear()} REGEXSOLVER`;
