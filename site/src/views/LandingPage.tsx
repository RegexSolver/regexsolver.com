"use client";

import { useState } from "react";
import { Page } from "../components/Page";
import { Demo } from "../components/Demo";
import { CustomCodeTabs } from "../components/CustomCodeTabs";
import { Link } from "../components/ui/Link";
import { generateLandingSnippet, rustTab } from "../lib/generateCode";
import { CRATE_URL, GITHUB_URL, docs } from "../lib/docs";

/* One page, in the manner of a library's home page, in the words of the
   crate's README (regexsolver/README.md): what it is, how to get it, the
   demo, its example, use cases and semantics. Keep the two saying the same
   thing. Everything deeper is on docs.rs. */

const INSTALL = "cargo add regexsolver";

const linkClass = "text-set-a hover:underline underline-offset-4";

/* The README's use cases: [name, methods, what they give]. */
const USE_CASES: [string, string[], string][] = [
  [
    "Safe migrations",
    ["old.subset(&new)?"],
    "tells you whether a new validation pattern accepts everything the old one did.",
  ],
  [
    "Equivalence proofs",
    ["a.equivalent(&b)?"],
    "shows that two patterns match the same strings.",
  ],
  [
    "Rule analysis",
    ["intersection", "difference"],
    "find shadowed or overlapping routes, firewall rules and validators.",
  ],
  [
    "Test data",
    ["generate_strings"],
    "produces strings that match a pattern, spread over the cases it allows, reproducible and pageable.",
  ],
  [
    "Input bounds",
    ["length()"],
    "gives the shortest and longest string a pattern matches, to size a database column.",
  ],
  [
    "Readable regexes",
    ["to_pattern"],
    "converts every result back to a pattern, and neural synthesis can make it simpler: try both in the demo.",
  ],
];

const h2Class = "display text-(length:--t-h3) mb-4";
const prose = "text-sm leading-relaxed text-muted-foreground";

/* Inline code: a tinted chip, so it reads as code inside prose. */
const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-[0.8125em] text-foreground bg-muted rounded-[3px] px-1.5 py-0.5 whitespace-nowrap">
    {children}
  </code>
);

export const LandingPage = () => {
  const [copied, setCopied] = useState(false);

  return (
    <Page>
      <h1 className="display text-(length:--t-h2)">
        Patterns as sets of strings<span className="text-set-b">.</span>
      </h1>
      <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted-foreground">
        The <Code>regex</Code> crate tells you whether a <em>string</em>{" "}
        matches a pattern. RegexSolver treats patterns as the sets of strings
        they match, so you can intersect, subtract, compare, complement and
        enumerate them, and get the result back as a regex.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(INSTALL);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          title="Copy to clipboard"
          className="group flex items-center gap-3 rounded-(--radius) border border-rule px-4 py-2.5 font-mono text-sm cursor-pointer hover:border-set-a transition-colors"
        >
          <span className="text-muted-foreground select-none">$</span>
          <span>{INSTALL}</span>
          <span className="text-[0.6875rem] tracking-[0.08em] text-muted-foreground group-hover:text-foreground">
            {copied ? "COPIED" : "COPY"}
          </span>
        </button>
        <div className="flex gap-5 text-sm">
          <Link to={docs()} className={linkClass}>
            Documentation ↗
          </Link>
          <Link to={GITHUB_URL} className={linkClass}>
            Source ↗
          </Link>
          <Link to={CRATE_URL} className={linkClass}>
            crates.io ↗
          </Link>
        </div>
      </div>

      <section className="mt-16">
        <h2 className={h2Class}>Try it</h2>
        <Demo />
      </section>

      <section className="mt-16">
        <h2 className={h2Class}>Example</h2>
        <CustomCodeTabs tabs={rustTab(generateLandingSnippet())} />
      </section>

      <section className="mt-16">
        <h2 className={h2Class}>Use cases</h2>
        <ul className={`list-disc pl-5 space-y-2 marker:text-rule ${prose}`}>
          {USE_CASES.map(([name, methods, gives]) => (
            <li key={name}>
              <strong className="font-medium text-foreground">{name}</strong>:{" "}
              {methods.map((method, i) => (
                <span key={method}>
                  {i > 0 && " and "}
                  <Code>{method}</Code>
                </span>
              ))}{" "}
              {gives}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className={h2Class}>Semantics</h2>
        <ul className={`list-disc pl-5 space-y-2 marker:text-rule ${prose}`}>
          <li>
            <strong className="font-medium text-foreground">
              Everything is anchored
            </strong>
            : <Code>abc</Code> matches the string &ldquo;abc&rdquo;, not
            &ldquo;xabc&rdquo; or &ldquo;abcx&rdquo;. A pattern describes whole
            strings.
          </li>
          <li>
            <strong className="font-medium text-foreground">
              <Code>.</Code> matches any character
            </strong>
            , including line feed.
          </li>
          <li>
            Constructs a regular language can&rsquo;t express, such as
            backreferences, lookaround, inline flags and word boundaries,
            return an error instead of changing what the pattern means.
          </li>
          <li>
            Automaton operations can blow up on adversarial patterns. To run
            untrusted input, set limits on run time and number of states with
            an{" "}
            <Link
              to={docs("execution_profile/struct.ExecutionProfile.html")}
              className={linkClass}
            >
              <Code>ExecutionProfile</Code>
            </Link>
            .
          </li>
        </ul>
        <p className={`mt-6 ${prose}`}>
          The hosted REST API and its SDKs have been retired: the crate is the
          way to use RegexSolver.
        </p>
      </section>
    </Page>
  );
};
