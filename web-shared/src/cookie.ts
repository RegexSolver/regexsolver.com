const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Reads a cookie value, or null when absent (or outside the browser). */
export const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
};

/**
 * Writes a cookie. Pass the parent domain (e.g. ".regexsolver.com") to share it
 * across every subdomain; leave it undefined in local dev (localhost).
 */
export const writeCookie = (
  name: string,
  value: string,
  domain?: string,
  maxAgeSeconds: number = ONE_YEAR_SECONDS,
) => {
  if (typeof document === "undefined") return;
  const parts = [
    `${name}=${value}`,
    "path=/",
    `max-age=${maxAgeSeconds}`,
    "SameSite=Lax",
  ];
  if (domain) parts.push(`domain=${domain}`);
  if (location.protocol === "https:") parts.push("Secure");
  document.cookie = parts.join("; ");
};
