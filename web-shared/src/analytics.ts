import { type Consent, getStoredConsent } from "./consent";

/**
 * Minimal structural slice of the PostHog client we use — posthog-js' default
 * export satisfies it. Declared here instead of importing posthog-js so this
 * package has ZERO runtime imports: it is consumed as a symlinked raw-TS file:
 * dependency, and a bare import would fail Node resolution (no node_modules
 * above apps/web-shared) during Zudoku's build-time prerender. Each app passes
 * its own posthog-js instance in.
 */
export interface AnalyticsClient {
  init(token: string, config: object): unknown;
  set_config(config: object): void;
  register(properties: object): void;
  capture(event: string, properties?: object): void;
}

export interface AnalyticsOptions {
  /** PostHog project token (public client key). Unset → analytics disabled. */
  token?: string;
  /** Ingestion host: the same-origin `/ingest` proxy in prod, the EU cloud in dev. */
  apiHost?: string;
  /**
   * Which frontend this is (`"website"` | `"console"` | `"docs"`). Registered as
   * the `app` super property so it rides on EVERY event — autocapture, pageviews
   * and custom captures alike — letting you filter/break-down by origin in PostHog.
   */
  source?: string;
  debug?: boolean;
}

let client: AnalyticsClient | null = null;

/**
 * Derives the deployment environment from the hostname so every event can be
 * split by dev vs prod in the shared PostHog project:
 *   regexsolver.com (+ console./docs.)       → "prod"
 *   dev.regexsolver.com (+ its subdomains)   → "dev"
 *   localhost / 127.0.0.1 / *.local          → "local"
 */
const detectEnvironment = (hostname: string): string => {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  ) {
    return "local";
  }
  // A "dev" label anywhere in the host (dev.regexsolver.com, dev.console…) → dev.
  return hostname.split(".").includes("dev") ? "dev" : "prod";
};

/**
 * Initializes PostHog identically across the website, console and docs.
 * Returns whether analytics is active (false outside the browser — e.g. during
 * SSR/prerendering — without a token, or on a local hostname).
 */
export const initAnalytics = (
  posthog: AnalyticsClient,
  { token, apiHost, source, debug = false }: AnalyticsOptions,
): boolean => {
  if (typeof window === "undefined" || !token) return false;

  // Local dev never initializes PostHog — no local noise in the shared project,
  // even when a .env carries a real token. Hostname-based (not NODE_ENV) so a
  // prod build served on localhost stays silent too; dev.regexsolver.com still
  // captures, labeled environment=dev.
  const environment = detectEnvironment(window.location.hostname);
  if (environment === "local") return false;

  posthog.init(token, {
    api_host: apiHost,
    ui_host: "https://eu.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    disable_session_recording: true, // ad-blockers block posthog-recorder.js by name even first-party
    capture_dead_clicks: false, // ad-blockers block dead-clicks-autocapture.js by name even first-party
    debug,
    // Default to cookieless, anonymous capture: no device storage (ePrivacy-exempt),
    // no persistent person profiles → runs on legitimate interest before/without consent.
    persistence: "memory",
    person_profiles: "identified_only",
    // Share the identified user's cookie across all subdomains (once they accept).
    cross_subdomain_cookie: true,
  });

  // Tag every event with its originating app + deployment environment so the shared
  // PostHog project can be filtered/broken down by source (website vs console vs docs)
  // and by env (dev vs prod, derived from the hostname).
  const superProps: Record<string, string> = { environment };
  if (source) superProps.app = source;
  posthog.register(superProps);

  // Returning visitors who accepted get the full experience: persistent cookies +
  // cross-session identification. No re-prompt needed.
  if (getStoredConsent() === "accepted") {
    posthog.set_config({ persistence: "localStorage+cookie" });
  }

  client = posthog;
  return true;
};

/**
 * Applies a (new) consent decision: accept upgrades to persistent cookies +
 * cross-session identification; decline stays on the default cookieless,
 * anonymous (legitimate-interest) capture. No-op when analytics is disabled.
 */
export const applyConsentToAnalytics = (consent: Consent) => {
  if (!client) return;
  client.set_config({
    persistence: consent === "accepted" ? "localStorage+cookie" : "memory",
  });
  client.capture("cookie_consent_decided", { consent });
};
