"use client";

import { useEffect, useRef } from "react";
import { useTypewriter } from "../lib/useTypewriter";

/* FIG. 2 — a widely used email validator (OWASP lists it as a ReDoS example),
   run through /analyze/pattern. The point is what the pattern accepts, not
   who wrote it: no reader should feel told off.

   Everything here is verified engine output for this term: the returned
   pattern, and both verdicts — "a@b.abcdefghij" matches it, while
   "user+tag@acme.io" does not. */

const HOST = "api.regexsolver.com/v1";
const ENDPOINT = "/analyze/pattern";
const TERM = "([a-zA-Z0-9_.-])+@(([a-zA-Z-])+\\.)+([a-zA-Z]{2,4})+";
const RESULT = "[\\-\\.0-9A-Z_a-z]+@([\\-A-Za-z]+\\.)+[A-Za-z]{2,}";

/* What the returned pattern gives away, in strings the reader can check. */
const FINDINGS = [
  {
    input: "a@b.abcdefghij",
    verdict: "accepted",
    why: 'the {2,4}+ tail is not "2 to 4"; any length ≥ 2 passes',
  },
  {
    input: "user+tag@acme.io",
    verdict: "rejected",
    why: "no + in the local part",
  },
];

const LABEL =
  "w-9 shrink-0 font-mono text-[0.625rem] font-medium tracking-[0.14em] text-muted-foreground pt-1";
const CODE = "min-w-0 font-mono text-[0.8125rem] leading-relaxed break-all";

export const EngineFigure = ({ figNo = "FIG. 2" }: { figNo?: string }) => {
  const figRef = useRef<HTMLElement>(null);
  const { out, typing, type } = useTypewriter();

  // Send on first view: the figure plays itself, there is nothing to click.
  useEffect(() => {
    const fig = figRef.current;
    if (!fig) return;
    if (!("IntersectionObserver" in window)) {
      type(RESULT);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          io.disconnect();
          type(RESULT);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(fig);
    return () => io.disconnect();
  }, [type]);

  // the findings only mean anything once the answer is on screen
  const answered = Boolean(out) && !typing;

  return (
    <>
      <style>{`
.finding{opacity:0;transform:translateY(2px);transition:opacity .3s ease,transform .3s ease}
[data-answered="true"] .finding{opacity:1;transform:none}
      `}</style>

      <figure
        ref={figRef}
        data-answered={answered}
        className="border border-rule rounded-(--radius) bg-background"
      >
        <div className="flex items-baseline gap-3 px-3.5 py-2.5 border-b border-rule">
          <span className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground whitespace-nowrap">
            {figNo}
          </span>
          <figcaption className="text-[0.8125rem] text-muted-foreground">
            A commonly seen email pattern,{" "}
            <b className="text-foreground font-medium">
              and what it really accepts
            </b>
          </figcaption>
        </div>

        {/* --- what you send --- */}
        <div className="px-3.5 py-3 border-b border-rule">
          {/* Stacks on a phone: the page root is a column flex container, so
              a row of two nowrap items here becomes the section's min-content
              width and stretches the whole section past the viewport. */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-3 font-mono text-[0.8125rem]">
            <span className="whitespace-nowrap">
              <span className="text-muted-foreground">POST </span>
              <span className="text-foreground">{ENDPOINT}</span>
            </span>
            <span className="text-[0.6875rem] text-muted-foreground whitespace-nowrap">
              {HOST}
            </span>
          </div>
          <div className="mt-2 flex gap-3">
            <span className={LABEL}>TERM</span>
            <code className={`${CODE} text-set-a`}>{TERM}</code>
          </div>
        </div>

        {/* --- what comes back, and what it gives away --- */}
        <div className="px-3.5 py-3 bg-(--overlap-08)">
          <div className="flex gap-3">
            <span className={`${LABEL} is-computed`}>200</span>
            <code className={`${CODE} is-computed font-medium`}>
              {out}
              {(typing || !out) && (
                <span
                  className="inline-block w-[0.5em] bg-overlap animate-pulse align-baseline"
                  aria-hidden
                >
                  &nbsp;
                </span>
              )}
            </code>
          </div>

          <div
            className="mt-3 grid grid-cols-[auto_auto] sm:grid-cols-[auto_auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[0.75rem]"
            aria-live="polite"
          >
            {FINDINGS.map((finding, i) => (
              <div
                key={finding.input}
                className="finding grid grid-cols-subgrid col-span-2 sm:col-span-3 items-baseline"
                style={{ transitionDelay: `${0.15 + i * 0.15}s` }}
              >
                <code className="font-mono text-foreground break-all">
                  {finding.input}
                </code>
                <span className="font-mono text-set-b whitespace-nowrap">
                  {finding.verdict}
                </span>
                {/* the reason drops to its own line rather than being
                    squeezed into a third column on a phone */}
                <span className="col-span-2 sm:col-span-1 text-muted-foreground">
                  {finding.why}
                </span>
              </div>
            ))}
          </div>
        </div>
      </figure>
    </>
  );
};
