import { applyConsentToAnalytics } from "./analytics";
import { type Consent, getStoredConsent, setStoredConsent } from "./consent";

export type { Consent };

/**
 * Framework-free cookie-banner behavior; the markup is in
 * components/CookieBanner.tsx. (No React here on purpose: this package is a
 * symlinked raw-TS file: dependency with zero runtime imports.)
 */
export const createCookieBanner = (cookieDomain?: string) => ({
  /** True when the user hasn't decided yet — check once on mount. */
  shouldShow: () => getStoredConsent() === null,
  /**
   * Persists the choice cross-subdomain (pass the parent cookie domain) and
   * applies it to PostHog.
   */
  decide: (consent: Consent) => {
    setStoredConsent(consent, cookieDomain);
    applyConsentToAnalytics(consent);
  },
});
