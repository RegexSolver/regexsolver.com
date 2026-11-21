export const CONSENT_STORAGE_KEY = "cookie-consent";
export type Consent = "accepted" | "declined";

// Scope the consent cookie to the parent domain (e.g. ".regexsolver.com") so the
// choice is shared across every subdomain. Leave unset in local dev (localhost).
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Reads the stored analytics-cookie consent, or null if the user hasn't decided. */
export const getStoredConsent = (): Consent | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CONSENT_STORAGE_KEY}=(accepted|declined)`),
  );
  return match ? (match[1] as Consent) : null;
};

/** Persists the consent choice in a cookie shared across all subdomains. */
export const setStoredConsent = (consent: Consent) => {
  if (typeof document === "undefined") return;
  const parts = [
    `${CONSENT_STORAGE_KEY}=${consent}`,
    "path=/",
    `max-age=${ONE_YEAR_SECONDS}`,
    "SameSite=Lax",
  ];
  if (COOKIE_DOMAIN) parts.push(`domain=${COOKIE_DOMAIN}`);
  if (location.protocol === "https:") parts.push("Secure");
  document.cookie = parts.join("; ");
};
