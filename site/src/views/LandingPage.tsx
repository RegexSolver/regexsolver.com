"use client";

import { useState } from "react";
import posthog, { analyticsEnabled } from "../lib/posthog";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CustomCodeTabs } from "../components/CustomCodeTabs";
import { docs } from "../lib/docs";
import { ChevronRight } from "lucide-react";
import { generateLandingSnippet } from "../lib/generateCode";
import { ActionLink } from "../components/ActionLink";
import { Link } from "../components/ui/Link";
import { SECTIONS } from "../lib/sections";
import { HERO_OPS, HeroFigure } from "../components/HeroFigure";
import { FAQS } from "../lib/faqs";

/* The hero already shows every operation with its drawing, its SDK call and
   its result, so the rest of the page only adds what the hero cannot: the
   setup code (install, client, chaining), how the engine works, and where to
   read more. Editable cards live on the section pages and the live demo.
   Prose is kept to one line per block. */

const HERO_ACTIONS = [
  {
    index: "01",
    label: "Get an API token",
    note: "Free plan: 10,000 requests per month",
    to: process.env.NEXT_PUBLIC_CONSOLE_URL || "#",
    primary: true,
    event: "get_started_clicked",
  },
  {
    index: "02",
    label: "Live demo",
    note: "No token needed",
    to: "/demo",
    primary: false,
    event: "try_demo_clicked",
  },
];

const LANGUAGES = [
  { value: "js", label: "JavaScript", language: "javascript" },
  { value: "java", label: "Java", language: "java" },
  { value: "python", label: "Python", language: "python" },
];

const INSTALL = [
  { name: "npm", command: "npm i regexsolver" },
  { name: "pip", command: "pip install regexsolver" },
  { name: "Maven", command: "com.regexsolver.api:RegexSolver" },
];

const HOW_IT_WORKS = [
  {
    title: "Finite automata",
    body: "Patterns are compiled to finite automata and the operations run on those. Every answer covers the whole language of the pattern.",
  },
  {
    title: "Bounded time",
    body: "There is no backtracking. Every request runs under a server-side execution timeout and an automaton-size limit, whatever the input pattern.",
  },
  {
    title: "Chaining",
    body: "The result of one operation can be passed straight into the next one. When you need a regex, ask for the result as a pattern.",
  },
  {
    title: "Supported syntax",
    body: "Pure regular expressions: character classes, quantifiers, alternation and groups. Patterns match the full string. Lookarounds and backreferences are not supported.",
  },
  {
    title: "Open source",
    body: "The automata engine is open-source Rust. The API adds the conversion from an automaton back to a readable regex.",
  },
];

export const LandingPage = () => {
  const [tabs] = useState(() =>
    LANGUAGES.map((lang) => ({
      ...lang,
      code: generateLandingSnippet(lang.value),
    })),
  );

  // Intersection is the opening drawing: the two inks and their overlap, the
  // site's own mark. The legend order is the API's (analyze, compute,
  // generate), so it is not the first row.
  const [activeOp, setActiveOp] = useState(() =>
    HERO_OPS.findIndex((op) => op.id === "intersection"),
  );

  return (
    <div className="w-full flex flex-col items-center bg-background text-foreground selection:bg-set-a/20 min-h-screen font-sans antialiased">
      <Header />

      {/* --- HERO: three bands. Headline and sentence on top; the legend and
          FIG. 1 side by side in the middle (the legend is the figure's
          control); the two actions side by side at the bottom. On a phone the
          figure comes before the legend, so the thing the legend controls is
          right above it. `grid-cols-1` matters below lg: with no template the
          implicit column sizes to its content, and a long snippet or result
          (subset, length, difference, strings) widens the page. --- */}
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-5 md:px-16 py-12 md:py-20 animate-fade-in">
          <div>
            <h1 className="display text-(length:--t-display) tracking-[-0.03em]">
              Set algebra for regex<span className="text-set-b">.</span>
            </h1>
            <p className="mt-6 text-[1.0625rem] leading-relaxed text-muted-foreground">
              A regex engine answers one question: does this string match?
              RegexSolver answers questions about the patterns themselves:
              whether two rules overlap, whether a validator accepts more than
              it should, what one pattern matches that another does not.
            </p>
          </div>

          <div className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-x-12 gap-y-8 items-start">
            <HeroFigure op={HERO_OPS[activeOp]} className="lg:order-last" />

            {/* The legend: one row per operation, notation in the inks, then
                the operation's name and one plain line of meaning. */}
            <div
              role="tablist"
              aria-label="Operation shown in the figure"
              className="border-y border-rule pb-2"
            >
              {HERO_OPS.map((op, i) => {
                const active = i === activeOp;
                const firstOfGroup = i === 0 || HERO_OPS[i - 1].group !== op.group;
                return (
                  <div key={op.id}>
                    {firstOfGroup && (
                      <div className="pt-3 pb-1 pl-3.5 font-mono text-[0.6875rem] font-medium tracking-[0.14em] uppercase text-muted-foreground">
                        {op.group}
                      </div>
                    )}
                    <button
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setActiveOp(i);
                        if (analyticsEnabled)
                          posthog.capture("hero_operation_selected", {
                            operation: op.id,
                          });
                      }}
                      className={`w-full flex items-baseline gap-4 py-1.5 pl-3 border-l-2 text-left text-sm cursor-pointer transition-colors ${
                        active
                          ? "border-l-set-a text-foreground"
                          : "border-l-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="notation font-mono w-16 shrink-0">
                        {op.notation}
                      </span>
                      <span>
                        <span className="font-medium">{op.name}</span>
                        <span className="text-muted-foreground">
                          {" · "}
                          {op.label}
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <nav
            aria-label="Get started"
            className="mt-10 md:mt-12 grid sm:grid-cols-2 gap-4"
          >
            {HERO_ACTIONS.map((action) => (
              <ActionLink
                key={action.label}
                {...action}
                onClick={() =>
                  analyticsEnabled &&
                  posthog.capture(action.event, { source: "hero" })
                }
              />
            ))}
          </nav>
        </div>
      </section>

      {/* --- CODE: what the hero's one-liners leave out — install, client,
          and results flowing into the next call --- */}
      <section className="w-full border-t border-rule">
        <div className="max-w-270 mx-auto px-5 md:px-16 py-16 md:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="display text-(length:--t-h2)">Install and call.</h2>
            <Link
              to={docs("/quickstart")}
              className="font-mono text-[0.8125rem] text-set-a hover:underline underline-offset-4"
            >
              Quickstart →
            </Link>
          </div>
          <p className="mt-4 max-w-(--measure) text-muted-foreground">
            Results are terms. Pass them straight into the next call.
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[0.8125rem]">
            {INSTALL.map((pkg) => (
              <div key={pkg.name} className="flex items-baseline gap-x-2">
                <dt className="text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {pkg.name}
                </dt>
                <dd className="text-foreground">{pkg.command}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 max-w-200">
            <CustomCodeTabs tabs={tabs} />
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS: one line each --- */}
      <section className="w-full border-t border-rule">
        <div className="max-w-270 mx-auto px-5 md:px-16 py-16 md:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="display text-(length:--t-h2)">How it works.</h2>
            <Link
              to="https://github.com/RegexSolver/regexsolver"
              className="font-mono text-[0.8125rem] text-set-a hover:underline underline-offset-4"
            >
              Engine source on GitHub →
            </Link>
          </div>
          <dl className="mt-8 border-t border-rule">
            {HOW_IT_WORKS.map((pt) => (
              <div
                key={pt.title}
                className="grid md:grid-cols-[14rem_minmax(0,1fr)] gap-x-8 gap-y-1 py-4 border-b border-rule"
              >
                <dt className="font-mono text-sm font-medium">{pt.title}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground max-w-(--measure)">
                  {pt.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --- IN DEPTH: one page per group of operations --- */}
      <section className="w-full border-t border-rule">
        <div className="max-w-270 mx-auto px-5 md:px-16 py-16 md:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="display text-(length:--t-h2)">In depth.</h2>
            <Link
              to={docs("/api")}
              className="font-mono text-[0.8125rem] text-set-a hover:underline underline-offset-4"
            >
              API reference →
            </Link>
          </div>
          <ul className="mt-8 grid md:grid-cols-3 gap-x-8 gap-y-6">
            {SECTIONS.map((section) => (
              <li key={section.slug} className="border-l-2 border-rule pl-4">
                <Link
                  to={`/${section.slug}/`}
                  className="block text-set-a font-medium hover:underline underline-offset-4"
                >
                  {section.title} →
                </Link>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {section.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- FAQ: collapsed, also the FAQPage JSON-LD source --- */}
      <section className="w-full border-t border-rule">
        <div className="max-w-180 mx-auto px-5 md:px-8 py-16 md:py-20">
          <h2 className="display text-(length:--t-h2)">Questions.</h2>
          <div className="mt-8 border-t border-rule">
            {FAQS.map((faq, i) => (
              <details key={i} className="group border-b border-rule">
                <summary className="py-4 flex items-center justify-between cursor-pointer list-none font-medium hover:text-set-a transition-colors">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0 ml-4" />
                </summary>
                <div className="pb-5 text-muted-foreground text-sm leading-relaxed space-y-3 max-w-(--measure)">
                  {faq.a.map((paragraph, j) => (
                    <p key={j}>{paragraph.node ?? paragraph.text}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
