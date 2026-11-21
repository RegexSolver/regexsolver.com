import { readCookie, writeCookie } from "./cookie";

export type SharedTheme = "light" | "dark" | "system";
export const THEME_COOKIE_KEY = "theme";

/**
 * Reads the cross-subdomain dark/light choice, or null if none was made yet.
 * "system" (set by a switcher that offers it; the site's toggles between light
 * and dark) resolves via prefers-color-scheme.
 */
export const getSharedTheme = (): SharedTheme | null => {
  const value = readCookie(THEME_COOKIE_KEY);
  return value === "light" || value === "dark" || value === "system"
    ? value
    : null;
};

/**
 * Persists the theme choice. Pass the parent cookie domain (e.g.
 * ".regexsolver.com") so a choice made on any of the sites applies to all of
 * them. Call this only on explicit user changes — a site resolving its own
 * default must not overwrite a choice made elsewhere.
 */
export const setSharedTheme = (theme: SharedTheme, cookieDomain?: string) => {
  writeCookie(THEME_COOKIE_KEY, theme, cookieDomain);
};
