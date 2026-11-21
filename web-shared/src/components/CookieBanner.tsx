"use client";

/* The cookie-consent banner. Behavior comes from ../cookie-banner
   (createCookieBanner). Per this package's rules the env var stays in the
   site: it passes its cookieDomain (NEXT_PUBLIC_COOKIE_DOMAIN) and its
   privacy-policy link. */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { type Consent, createCookieBanner } from "../cookie-banner";

export const CookieBanner = ({
  cookieDomain,
  privacyLink,
}: {
  cookieDomain: string | undefined;
  privacyLink: ReactNode;
}) => {
  const banner = useMemo(() => createCookieBanner(cookieDomain), [cookieDomain]);
  // Visibility is seeded in an effect, never during render: the static export
  // prerenders this tree, and reading the consent cookie at render time would
  // make the server and client HTML disagree.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(banner.shouldShow());
  }, [banner]);

  const decide = (consent: Consent) => {
    banner.decide(consent);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-[4px] border border-border bg-card text-card-foreground p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground leading-relaxed">
          We use essential cookies to make RegexSolver work. With your consent
          we may also use cookies to understand how the site is used. See our{" "}
          {privacyLink}.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => decide("declined")}
            className="inline-flex items-center justify-center h-8 px-3 rounded-[4px] text-sm font-medium border border-border bg-transparent hover:bg-accent transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="inline-flex items-center justify-center h-8 px-3 rounded-[4px] text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
