"use client";

import { CookieBanner as SharedCookieBanner } from "@regexsolver/web-shared/components/CookieBanner";
import { Link } from "./ui/Link";
import { docs } from "../lib/docs";

export const CookieBanner = () => (
  <SharedCookieBanner
    cookieDomain={process.env.NEXT_PUBLIC_COOKIE_DOMAIN}
    privacyLink={
      <Link
        to={docs("/privacy")}
        className="text-foreground font-medium underline underline-offset-4"
      >
        Privacy Policy
      </Link>
    }
  />
);
