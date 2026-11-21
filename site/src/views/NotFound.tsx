"use client";

import { Page } from "../components/Page";
import { Link } from "../components/ui/Link";

/* The static export's 404.html: GitHub Pages serves it for every URL that
   matches no prerendered page, so stale inbound links land here. */
export const NotFound = () => (
  <Page>
    <h1 className="display text-(length:--t-h2)">Page not found</h1>
    <p className="mt-4 leading-relaxed text-muted-foreground">
      This address matches no page on the site.{" "}
      <Link to="/" className="text-set-a hover:underline underline-offset-4">
        Back to the home page
      </Link>
      .
    </p>
  </Page>
);
