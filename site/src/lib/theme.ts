import {
  getSharedTheme,
  setSharedTheme as persist,
  type SharedTheme,
} from "@regexsolver/web-shared/theme";

export type { SharedTheme };
export { getSharedTheme };

/** Persists the theme choice in a cookie shared across all subdomains. */
export const setSharedTheme = (theme: SharedTheme) =>
  persist(theme, process.env.NEXT_PUBLIC_COOKIE_DOMAIN);
