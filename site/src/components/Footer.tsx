import {
  COPYRIGHT,
  FOOTER_LINKS,
  isExternalSiteLink,
} from "@regexsolver/web-shared/site-links";
import { Link } from "./ui/Link";

export const Footer = () => (
  <footer className="w-full">
    <div className="max-w-3xl mx-auto px-5 py-10 border-t border-rule flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 text-sm text-muted-foreground">
      <nav className="flex flex-wrap gap-x-5 gap-y-2">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.path}
            {...(isExternalSiteLink(link) ? { target: "_blank" } : {})}
            className="hover:text-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <span className="font-mono text-[0.6875rem] tracking-[0.08em]">
        {COPYRIGHT}
      </span>
    </div>
  </footer>
);
