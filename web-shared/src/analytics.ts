/**
 * Minimal structural slice of the PostHog client we use — posthog-js' default
 * export satisfies it. Declared here instead of importing posthog-js so this
 * package has ZERO runtime imports: it is consumed as a symlinked raw-TS file:
 * dependency, where a bare import can fail Node resolution. The site passes
 * its posthog-js instance in.
 */
export interface AnalyticsClient {
  init(token: string, config: object): unknown;
  register(properties: object): void;
  capture(event: string, properties?: object): void;
}

export interface AnalyticsOptions {
  /** PostHog project token (public client key). Unset → analytics disabled. */
  token?: string;
  /** Ingestion host: PostHog's EU cloud. */
  apiHost?: string;
  /**
   * Which frontend this is (`"website"`). Registered as the `app` super property
   * so it rides on every event, letting you filter by origin in PostHog.
   */
  source?: string;
  debug?: boolean;
}

/**
 * Derives the deployment environment from the hostname so every event can be
 * split by dev vs prod in the PostHog project:
 *   regexsolver.com                          → "prod"
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
  // A "dev" label anywhere in the host (dev.regexsolver.com) → dev.
  return hostname.split(".").includes("dev") ? "dev" : "prod";
};

/**
 * Initializes PostHog, cookieless and anonymous: nothing is stored on the
 * visitor's device and no person profile is created, so there is no consent
 * to ask for. The site's privacy policy (site/src/views/Privacy.tsx) says so;
 * keep the two in step. Returns whether analytics is active (false outside
 * the browser — e.g. during prerendering — without a token, or on a local
 * hostname).
 */
export const initAnalytics = (
  posthog: AnalyticsClient,
  { token, apiHost, source, debug = false }: AnalyticsOptions,
): boolean => {
  if (typeof window === "undefined" || !token) return false;

  // Local dev never initializes PostHog — no local noise in the project, even
  // when a .env carries a real token. Hostname-based (not NODE_ENV) so a prod
  // build served on localhost stays silent too.
  const environment = detectEnvironment(window.location.hostname);
  if (environment === "local") return false;

  posthog.init(token, {
    api_host: apiHost,
    ui_host: "https://eu.posthog.com",
    defaults: "2026-01-30",
    // Error reports could carry what a visitor typed.
    capture_exceptions: false,
    disable_session_recording: true,
    capture_dead_clicks: false,
    debug,
    // No cookies, localStorage or sessionStorage: identifiers live in memory
    // and end with the page.
    persistence: "memory",
    person_profiles: "identified_only",
  });

  // Tag every event with its originating app and deployment environment (dev
  // vs prod, derived from the hostname), so the PostHog project can be
  // filtered by both.
  const superProps: Record<string, string> = { environment };
  if (source) superProps.app = source;
  posthog.register(superProps);

  return true;
};
