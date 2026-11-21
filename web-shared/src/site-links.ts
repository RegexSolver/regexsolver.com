/**
 * The cross-site header nav and footer links, shared by the website and docs
 * so the content can never drift (markup stays app-specific, like the cookie
 * banner). Each link names the site its path lives on; consumers resolve the
 * origins they know from their own env (NEXT_PUBLIC_* / ZUDOKU_PUBLIC_*).
 *
 * Paths are stored exactly as each target expects them: website paths carry
 * the trailing slash (Next static export with `trailingSlash`), docs paths
 * don't (Zudoku routes). External links are absolute URLs and open in a new
 * tab; labels carry a literal ↗ like the rest of the UI.
 */

export type SiteLink = {
  label: string;
  /** Which origin `path` lives on — consumers map these to base URLs. */
  site: "website" | "docs" | "console" | "external";
  path: string;
  /** One line shown under the label inside a nav dropdown. */
  description?: string;
};

/** A labelled section in the header nav, rendered as a dropdown. */
export type SiteNavGroup = {
  label: string;
  items: SiteLink[];
};

export type SiteNavItem = SiteLink | SiteNavGroup;

export const isSiteNavGroup = (item: SiteNavItem): item is SiteNavGroup =>
  "items" in item;

export type SiteOrigins = {
  /** "" when the link target is the app itself (renders a relative path). */
  website: string;
  docs: string;
  console: string;
};

export const resolveSiteLink = (link: SiteLink, origins: SiteOrigins): string =>
  link.site === "external" ? link.path : origins[link.site] + link.path;

/** True when the link should open in a new tab. */
export const isExternalSiteLink = (link: SiteLink): boolean =>
  link.site === "external";

/** Header nav, in display order: kept identical on website and docs.
 *
 * A `SiteNavGroup` entry becomes a dropdown. The docs get that for free from
 * Zudoku's own `header.navigation` (it accepts `{label, items}` groups); the
 * website replicates the same markup in `Header.tsx`, as with the footer.
 * `description` is only rendered inside a dropdown, so top-level links omit it. */
export const NAV_ITEMS: SiteNavItem[] = [
  {
    label: "Features",
    items: [
      {
        label: "Regex analysis",
        site: "website",
        path: "/regex-analysis/",
        description: "Count matches and compare two patterns.",
      },
      {
        label: "Pattern manipulation",
        site: "website",
        path: "/pattern-manipulation/",
        description: "Intersect, subtract and complement patterns.",
      },
      {
        label: "String generation",
        site: "website",
        path: "/strings-generation/",
        description: "Generate distinct, repeatable test data.",
      },
    ],
  },
  { label: "Live Demo", site: "website", path: "/demo/" },
  { label: "Docs", site: "docs", path: "/" },
  { label: "Pricing", site: "website", path: "/pricing/" },
  {
    label: "Open Source ↗",
    site: "external",
    path: "https://github.com/RegexSolver/regexsolver",
  },
];

/** Footer columns: kept identical on website and docs. */
export const FOOTER_COLUMNS: { title: string; links: SiteLink[] }[] = [
  {
    // The three capability pages, mirroring the header's Features dropdown —
    // a crawlable link to them from every page on both sites is what makes
    // them candidates for Google sitelinks.
    title: "FEATURES",
    links: [
      { label: "Regex analysis", site: "website", path: "/regex-analysis/" },
      {
        label: "Pattern manipulation",
        site: "website",
        path: "/pattern-manipulation/",
      },
      {
        label: "String generation",
        site: "website",
        path: "/strings-generation/",
      },
    ],
  },
  {
    title: "HELP",
    links: [
      { label: "Documentation", site: "docs", path: "/" },
      {
        label: "Report an issue ↗",
        site: "external",
        path: "https://github.com/RegexSolver/feedback/issues",
      },
    ],
  },
  {
    title: "RESOURCES",
    links: [
      { label: "Live demo", site: "website", path: "/demo/" },
      { label: "Pricing", site: "website", path: "/pricing/" },
      { label: "Developer console", site: "console", path: "" },
      {
        label: "GitHub ↗",
        site: "external",
        path: "https://github.com/RegexSolver",
      },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "Privacy policy", site: "docs", path: "/privacy" },
      { label: "Terms & conditions", site: "docs", path: "/terms" },
    ],
  },
];

export const COPYRIGHT = `© ${new Date().getFullYear()} REGEXSOLVER · ALL RIGHTS RESERVED`;
