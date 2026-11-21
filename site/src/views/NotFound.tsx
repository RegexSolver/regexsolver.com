"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ActionLink } from "../components/ActionLink";
import { Link } from "../components/ui/Link";
import { docs } from "../lib/docs";
import { SECTIONS } from "../lib/sections";

/* The static export's 404.html: rs-website serves it for every URL that
   matches no prerendered page (deliberately no index fallback, see its
   CLAUDE.md), so stale inbound links land here. Full chrome plus the site's
   main destinations, so the visitor has somewhere to go. */

export const NotFound = () => {
  const links = [
    { label: "Live demo", to: "/demo" },
    ...SECTIONS.map((s) => ({ label: s.title, to: `/${s.slug}/` })),
    { label: "Documentation", to: docs("") },
    { label: "Pricing", to: "/pricing" },
  ];

  return (
    <div className="w-full flex flex-col items-center bg-background text-foreground selection:bg-set-a/20 min-h-screen font-sans antialiased">
      <Header />

      <section className="w-full flex-1">
        <div className="max-w-270 mx-auto px-5 md:px-16 py-16 md:py-24 animate-fade-in">
          <p className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground">
            ERROR 404
          </p>
          <h1 className="display text-(length:--t-display) tracking-[-0.03em] mt-5">
            Page not found.
          </h1>
          <p className="mt-6 max-w-(--measure) text-[1.0625rem] leading-relaxed text-muted-foreground">
            This address matches no page on the site.
          </p>
          <p className="mt-4 font-mono text-[0.8125rem]">
            <span className="text-set-a">request</span>{" "}
            <span className="notation text-muted-foreground">∩</span>{" "}
            <span className="text-set-b">site</span>{" "}
            <span className="notation text-muted-foreground">→</span>{" "}
            <span className="is-computed notation">∅</span>
          </p>

          <div className="mt-8 max-w-md">
            <ActionLink to="/" label="Back to the homepage" note="regexsolver.com" primary />
          </div>

          <ul className="mt-12 grid sm:grid-cols-3 gap-x-8 gap-y-3 max-w-200">
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="block border-l-2 border-rule pl-3 py-0.5 text-sm text-set-a hover:underline underline-offset-4"
                >
                  {link.label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
};
