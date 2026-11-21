"use client";

import { useState } from "react";
import posthog, { analyticsEnabled } from "../lib/posthog";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CustomCodeTabs } from "../components/CustomCodeTabs";
import { SectionExampleCard } from "../components/SectionExampleCard";
import { TableScroll } from "../components/TableScroll";
import { ActionLink } from "../components/ActionLink";
import { Link } from "../components/ui/Link";
import { docs } from "../lib/docs";
import { generateSectionSnippet } from "../lib/generateCode";
import { OpTableRows } from "../lib/operations";
import type { Section } from "../lib/sections";

const LANGUAGES = [
  { value: "js", label: "JavaScript", language: "javascript" },
  { value: "java", label: "Java", language: "java" },
  { value: "python", label: "Python", language: "python" },
];

export const SectionPage = ({ section }: { section: Section }) => {
  const [tabs] = useState(() =>
    LANGUAGES.map((lang) => ({
      ...lang,
      code: generateSectionSnippet(section.slug, lang.value),
    })),
  );

  return (
    <div className="w-full flex flex-col items-center bg-background text-foreground selection:bg-set-a/20 min-h-screen font-sans antialiased">
      <Header />

      {/* --- HERO --- */}
      <section className="w-full">
        <div className="max-w-270 mx-auto px-5 md:px-16 py-12 md:py-20 animate-fade-in">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground">
              <li>
                <Link
                  to="/"
                  className="hover:text-foreground transition-colors"
                >
                  HOME
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-set-a uppercase">{section.title}</li>
            </ol>
          </nav>

          {/* Same display size as the landing h1, capped in ch so it wraps like
              a headline instead of stretching across the full section width. */}
          <h1 className="display text-(length:--t-display) tracking-[-0.03em] mt-5 max-w-[22ch]">
            {section.heading}
          </h1>
          <p className="mt-6 max-w-(--measure) text-[1.0625rem] leading-relaxed text-muted-foreground">
            {section.intro}
          </p>

          <nav
            aria-label="Get started"
            className="mt-8 grid sm:grid-cols-2 gap-4 max-w-3xl"
          >
            <ActionLink
              index="01"
              to="/demo"
              label="Live demo"
              note="No token needed"
              primary
              onClick={() =>
                analyticsEnabled &&
                posthog.capture("try_demo_clicked", { source: section.slug })
              }
            />
            <ActionLink
              index="02"
              to={docs("/quickstart")}
              label="Documentation"
              note="Quickstart"
            />
          </nav>
        </div>
      </section>

      {/* --- EXAMPLES · live figure section --- */}
      <section className="w-full border-t border-rule">
        <div className="max-w-270 mx-auto px-5 md:px-16 py-16 md:py-20">
          <h2 className="display text-(length:--t-h2)">
            Try it.
          </h2>
          <p className="mt-4 max-w-(--measure) text-muted-foreground">
            Each card calls the real API. Edit the patterns and compute. No
            signup.
          </p>
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {/* A card only pads itself out to match the one sitting beside it
                in the 2-column grid — reserving a B row or a COMPUTE button
                that NEITHER card in the row has would just be dead space
                (which is why this is a per-row question, not a per-section
                one). Rows are the [0,1], [2,3] … pairs, so the partner is the
                neighbouring index. */}
            {section.examples.map((example, i) => {
              const partner = section.examples[i % 2 === 0 ? i + 1 : i - 1];
              return (
                <SectionExampleCard
                  key={example.title}
                  example={example}
                  source={section.slug}
                  alignSecondPattern={
                    partner !== undefined && partner.b !== undefined
                  }
                  alignCompute={
                    partner !== undefined && partner.demoOp !== undefined
                  }
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* --- OPERATIONS · table section --- */}
      <section className="w-full border-t border-rule">
        <div className="max-w-270 mx-auto px-5 md:px-16 py-16 md:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
            <h2 className="display text-(length:--t-h2)">Operations.</h2>
            <Link
              to={docs("/api")}
              className="font-mono text-[0.8125rem] text-set-a hover:underline underline-offset-4"
            >
              API reference →
            </Link>
          </div>

          <TableScroll>
            <table className="w-full border border-rule border-collapse min-w-160">
              <thead>
                <tr className="text-left">
                  <th className="py-2 pr-4 pl-3 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Operation
                  </th>
                  <th className="py-2 pr-4 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Notation
                  </th>
                  <th className="py-2 pr-4 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Answers
                  </th>
                  <th className="py-2 pr-3 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase text-right">
                    Returns
                  </th>
                </tr>
              </thead>
              <tbody>
                <OpTableRows rows={section.rows} />
              </tbody>
            </table>
          </TableScroll>

          {section.parameters && (
            <>
              <h3 className="display text-(length:--t-h3) font-semibold mt-12 mb-4">
                Parameters
              </h3>
              <TableScroll>
                <table className="w-full border border-rule border-collapse min-w-160">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2 pr-4 pl-3 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        Parameter
                      </th>
                      <th className="py-2 pr-4 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        Values
                      </th>
                      <th className="py-2 pr-3 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        Meaning
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.parameters.map((param) => (
                      <tr key={param.name} className="border-t border-rule">
                        <td className="py-2 pr-4 pl-3 font-mono text-sm font-medium whitespace-nowrap">
                          {param.name}
                        </td>
                        <td className="py-2 pr-4 font-mono text-sm whitespace-nowrap text-muted-foreground">
                          {param.values}
                        </td>
                        <td className="py-2 pr-3 text-sm text-muted-foreground">
                          {param.means}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </>
          )}
        </div>
      </section>

      {/* --- CODE · full-overview section --- */}
      <section className="w-full border-t border-rule">
        <div className="max-w-270 mx-auto px-5 md:px-16 py-16 md:py-20">
          <h2 className="display text-(length:--t-h2)">In code.</h2>
          <p className="mt-4 max-w-(--measure) text-muted-foreground">
            The main operations on this page, called through the official SDK.
          </p>
          <div className="mt-8 max-w-200">
            <CustomCodeTabs tabs={tabs} />
          </div>
        </div>
      </section>

      {/* --- FURTHER READING --- */}
      <section className="w-full border-t border-rule">
        <div className="max-w-270 mx-auto px-5 md:px-16 py-16 md:py-20">
          <h2 className="display text-(length:--t-h2)">Docs.</h2>
          <ul className="mt-8 grid md:grid-cols-3 gap-x-8 gap-y-4">
            {section.furtherReading.map((doc) => (
              <li key={doc.path}>
                <Link
                  to={docs(doc.path)}
                  className="block border-l-2 border-rule pl-3 py-0.5 text-sm text-set-a hover:underline underline-offset-4"
                >
                  {doc.label} →
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
