import {
  FooterContent,
  type RenderFooterLink,
} from "@regexsolver/web-shared/components/FooterContent";
import { Link } from "./ui/Link";
import { Logo } from "./Logo";

/* Content markup lives in web-shared (FooterContent), shared with the docs
   footer (zudoku.config.tsx footer-after slot). This wrapper owns the <footer>
   shell — whose geometry (max-w-screen-2xl px-4 lg:px-8) mirrors Zudoku's fixed
   footer wrapper so the docs only need to compensate the wrapper's top padding
   — and routes internal links through next/link via the local <Link>. */

const ORIGINS = {
  website: "",
  docs: process.env.NEXT_PUBLIC_DOCS_URL || "",
  console: process.env.NEXT_PUBLIC_CONSOLE_URL || "#",
};

const renderLink: RenderFooterLink = (link, { href, external, className }) => (
  <Link
    to={href}
    {...(external ? { target: "_blank" } : {})}
    className={className}
  >
    {link.label}
  </Link>
);

export const Footer = () => {
  return (
    <footer className="w-full border-t border-rule bg-background">
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-8 pt-14 pb-8">
        <FooterContent
          origins={ORIGINS}
          renderLink={renderLink}
          logo={<Logo className="h-4 w-auto shrink-0" />}
        />
      </div>
    </footer>
  );
};
