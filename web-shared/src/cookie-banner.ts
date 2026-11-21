import { applyConsentToAnalytics } from "./analytics";
import { type Consent, getStoredConsent, setStoredConsent } from "./consent";

export type { Consent };

/**
 * Framework-free cookie-banner behavior — the markup and a tiny useState wrapper
 * stay app-specific. (No React here on purpose: this package is a symlinked
 * raw-TS file: dependency with ZERO runtime imports, because bare imports fail
 * Node resolution during Zudoku's build-time prerender.)
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
