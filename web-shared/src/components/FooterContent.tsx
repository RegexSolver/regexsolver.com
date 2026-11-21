/* The footer's inner content — columns, rule, logo row — shared by the website
   (Footer.tsx) and the docs (zudoku.config.tsx footer-after slot), which used
   to duplicate this markup verbatim. The OUTER wrapper stays per-app: the
   website provides its own <footer> + container, the docs render inside
   Zudoku's footer shell (which already applies the container and padding).

   `md:grid-cols-4` must equal the number of FOOTER_COLUMNS entries. */

import type { ReactNode } from "react";
import {
  COPYRIGHT,
  FOOTER_COLUMNS,
  isExternalSiteLink,
  resolveSiteLink,
  type SiteLink,
  type SiteOrigins,
} from "../site-links";

export type RenderFooterLink = (
  link: SiteLink,
  resolved: { href: string; external: boolean; className: string },
) => ReactNode;

/* Plain-anchor default (what the docs use). The website passes its own
   renderer so internal links go through next/link and stay client-side. */
const defaultRenderLink: RenderFooterLink = (link, { href, external, className }) => (
  <a
    href={href}
    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    className={className}
  >
    {link.label}
  </a>
);

export const FooterContent = ({
  origins,
  logo,
  renderLink = defaultRenderLink,
}: {
  origins: SiteOrigins;
  /** The lockup in the bottom row — <Logo/> on the website/console (token
      colours), the light/dark <img> pair on the docs. */
  logo: ReactNode;
  renderLink?: RenderFooterLink;
}) => (
  <div className="mx-auto max-w-[952px]">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {FOOTER_COLUMNS.map((col) => (
        <div key={col.title}>
          <span className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground">
            {col.title}
          </span>
          <ul className="mt-4 space-y-2">
            {col.links.map((link) => (
              <li key={link.label}>
                {renderLink(link, {
                  href: resolveSiteLink(link, origins),
                  external: isExternalSiteLink(link),
                  className:
                    "block text-sm text-muted-foreground hover:text-foreground transition-colors",
                })}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t mt-8 pt-8">
      {logo}
      {/* Both lines share the copyright's small mono style so the operator
          line reads as part of the colophon rather than a callout. */}
      <div className="space-y-1 text-right font-mono text-[0.6875rem] tracking-[0.08em] text-muted-foreground">
        <p>{COPYRIGHT}</p>
      </div>
    </div>
  </div>
);
