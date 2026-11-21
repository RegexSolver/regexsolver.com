"use client";

import { Link } from "./ui/Link";

/* The site's call to action: an index row rather than a button. A numbered
   label in the mono caps the figure captions use, the action, a one-line
   note, and an arrow that slides on hover. The colour rule holds: set-a marks
   the primary action, everything else stays in ink. The arrow says where the
   link goes — ↗ leaves the site (console, docs), → stays on it. */

export type ActionLinkProps = {
  to: string;
  label: string;
  /** One short line under the label, set in mono caps. */
  note?: string;
  /** "01", "02"… when the link is one of a numbered set. */
  index?: string;
  primary?: boolean;
  onClick?: () => void;
  className?: string;
};

export const ActionLink = ({
  to,
  label,
  note,
  index,
  primary = false,
  onClick,
  className = "",
}: ActionLinkProps) => {
  const external = /^(https?:)?\/\//.test(to);
  return (
    <Link
      to={to}
      target={external ? "_blank" : undefined}
      onClick={onClick}
      className={`group flex items-center gap-4 px-5 py-4 border border-rule rounded-(--radius) transition-colors hover:bg-(--set-a-05) ${className}`}
    >
      {index && (
        <span className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground">
          {index}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span
          className={`block font-medium ${primary ? "text-set-a" : "text-foreground"}`}
        >
          {label}
        </span>
        {note && (
          <span className="block mt-0.5 font-mono text-[0.6875rem] tracking-[0.08em] uppercase text-muted-foreground">
            {note}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={`notation transition-transform group-hover:translate-x-1 ${primary ? "text-set-a" : "text-muted-foreground"}`}
      >
        {external ? "↗" : "→"}
      </span>
    </Link>
  );
};
