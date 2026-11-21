import { readCookie, writeCookie } from "./cookie";

export type Consent = "accepted" | "declined";
export const CONSENT_STORAGE_KEY = "cookie-consent";

/** Reads the stored analytics-cookie consent, or null if the user hasn't decided. */
export const getStoredConsent = (): Consent | null => {
  const value = readCookie(CONSENT_STORAGE_KEY);
  return value === "accepted" || value === "declined" ? value : null;
};

/**
 * Persists the consent choice. Pass the parent cookie domain (e.g.
 * ".regexsolver.com") so the choice is shared across every subdomain.
 */
export const setStoredConsent = (consent: Consent, cookieDomain?: string) => {
  writeCookie(CONSENT_STORAGE_KEY, consent, cookieDomain);
};
