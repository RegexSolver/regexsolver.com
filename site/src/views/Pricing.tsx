"use client";

import posthog, { analyticsEnabled } from "../lib/posthog";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ActionLink } from "../components/ActionLink";
import { Link } from "../components/ui/Link";
import { docs } from "../lib/docs";

export const Pricing = () => {
  const freePlanLimits = [
    { label: "Monthly requests", value: "10,000" },
    { label: "Rate limit", value: "2 req / second" },
    { label: "API tokens", value: "up to 5" },
    { label: "Terms per request", value: "up to 5" },
    { label: "Execution timeout", value: "500 ms" },
    { label: "Automaton states", value: "up to 1,000" },
  ];

  return (
    <div className="w-full flex flex-col items-center bg-background text-foreground selection:bg-set-a/20 min-h-screen font-sans antialiased">
      <Header />

      {/* --- PAGE HEADER --- */}
      <section className="w-full">
        <div className="max-w-270 mx-auto px-5 md:px-16 pt-12 md:pt-16 pb-10">
          <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">
            One plan, free.
          </h1>
          <p className="mt-4 max-w-(--measure) text-muted-foreground leading-relaxed">
            Only the Free plan is available for now. Paid plans with higher
            limits will follow.
          </p>
        </div>
      </section>

      {/* --- PLAN · table section --- */}
      <section className="w-full">
        <div className="max-w-270 mx-auto px-5 md:px-16 pb-16 md:pb-24 grid lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
          <div className="max-w-md border border-rule rounded-(--radius)">
            <div className="flex items-baseline justify-between gap-4 px-4 py-3 border-b border-rule">
              <span className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground">
                FREE PLAN
              </span>
              <span className="font-mono text-sm font-medium">€0 / month</span>
            </div>

            <table className="w-full border-collapse">
              <tbody>
                {freePlanLimits.map((limit) => (
                  <tr key={limit.label} className="border-b border-rule">
                    <td className="py-2 pl-4 pr-4 text-sm text-muted-foreground">
                      {limit.label}
                    </td>
                    <td className="py-2 pr-4 font-mono text-sm text-right whitespace-nowrap">
                      {limit.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 space-y-4">
              {/* Same destination as the hero CTA: the console sign-up, the
                  highest-intent visitors land here. The docs quickstart stays
                  one line below. */}
              <ActionLink
                to={process.env.NEXT_PUBLIC_CONSOLE_URL || "#"}
                label="Get an API token"
                note="In the console"
                primary
                onClick={() =>
                  analyticsEnabled &&
                  posthog.capture("pricing_cta_clicked", { plan: "free" })
                }
              />
              <p className="font-mono text-[0.8125rem] text-center">
                <Link
                  to={docs("/plans-pricing")}
                  className="text-set-a hover:underline underline-offset-4"
                >
                  Limits in detail →
                </Link>
              </p>
            </div>
          </div>

          {/* Plain-language notes on the plan table, kept short. Facts must
              match the backend (one request per operation call; quota and
              rate rejections) and the SDKs' automatic rate-limit handling —
              never phrase the rate limit as the user's problem to solve. */}
          <div className="space-y-8 max-w-(--measure)">
            <div>
              <h2 className="display text-(length:--t-h3) font-semibold">
                What counts as a request?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                One API call is one request, however heavy the computation.
                Terms are the patterns inside that call: comparing two patterns
                is still a single request, using two terms.
              </p>
            </div>
            <div>
              <h2 className="display text-(length:--t-h3) font-semibold">
                What if I hit a limit?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Nothing breaks and nothing is billed. The call comes back with a
                clear error, the official SDKs pace themselves around the rate
                limit for you, and your monthly requests reset at the start of
                each month.
              </p>
            </div>
            <div>
              <h2 className="display text-(length:--t-h3) font-semibold">
                Why a timeout and a state limit?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                They keep every response fast and predictable. Everyday patterns
                stay well below both; an unusually complex one returns an
                explicit error instead of hanging, and your other calls are
                unaffected.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
