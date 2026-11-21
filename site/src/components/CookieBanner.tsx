"use client";

import { CookieBanner as SharedCookieBanner } from "@regexsolver/web-shared/components/CookieBanner";
import { Link } from "./ui/Link";

export const CookieBanner = () => (
  <SharedCookieBanner
    cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN}
    privacyLink={
      <Link
        to="/privacy/"
        className="text-foreground font-medium underline underline-offset-4"
      >
        Privacy Policy
      </Link>
    }
  />
);
