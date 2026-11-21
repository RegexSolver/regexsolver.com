import posthog from "posthog-js";
import { initAnalytics } from "@regexsolver/web-shared/analytics";

// Setup in web-shared/src/analytics.ts: cookieless anonymous capture by
// default, upgraded to persistent cookies when the consent cookie says
// "accepted". Run for its side effect from
// instrumentation-client.ts so PostHog is ready before first render.

/** False when NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is unset or on a local hostname
    (initAnalytics never inits PostHog during local dev). */
export const analyticsEnabled = initAnalytics(posthog, {
  token: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  source: "website",
  debug: process.env.NODE_ENV === "development",
});

export default posthog;
