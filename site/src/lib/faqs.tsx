import { Link } from "../components/ui/Link";

/* The landing-page FAQ, single source for two consumers: the visible
   accordion (views/LandingPage.tsx) and the FAQPage JSON-LD (app/page.tsx).
   Every paragraph carries plain `text` for the structured data; the optional
   `node` is the rendered form for paragraphs that need markup (links).
   Google requires the JSON-LD to mirror the visible answer, so when a
   paragraph has both, keep text and node saying exactly the same thing. */

export type FaqParagraph = { text: string; node?: React.ReactNode };
export type Faq = { q: string; a: FaqParagraph[] };

export const FAQS: Faq[] = [
  {
    q: "How is RegexSolver different from a regex engine or validator?",
    a: [
      {
        text: 'A regex engine executes one pattern against one string at a time. RegexSolver treats patterns as mathematical sets and answers structural questions about them: "do these two rules overlap?", "is this validator too permissive?", or "what strings exist in A but not B?"',
      },
      {
        text: "Think of it as static analysis for your patterns: it inspects what they can match without ever executing them on real data.",
      },
    ],
  },
  {
    q: "How do I combine multiple regex patterns into one?",
    a: [
      {
        text: "Call the union operation with any number of patterns and it returns one pattern that matches everything the inputs matched. Intersection gives you the pattern both inputs accept, and difference subtracts one pattern from another.",
      },
      {
        text: "The result is a single clean pattern, ready to use in your own code. See the pattern manipulation page for worked examples.",
        node: (
          <>
            The result is a single clean pattern, ready to use in your own
            code. See the{" "}
            <Link
              to="/pattern-manipulation"
              className="text-set-a underline underline-offset-2 hover:opacity-80"
            >
              pattern manipulation
            </Link>{" "}
            page for worked examples.
          </>
        ),
      },
    ],
  },
  {
    q: "How do I check if two regex patterns are equivalent?",
    a: [
      {
        text: "Call the equivalence operation with the two patterns and it answers by comparing the full languages they match, so patterns written in completely different ways still compare as equal when they accept the same strings.",
      },
      {
        text: "The subset operation answers the related question of containment: whether everything one pattern matches is also matched by the other. See the regex analysis page for worked examples.",
        node: (
          <>
            The subset operation answers the related question of containment:
            whether everything one pattern matches is also matched by the
            other. See the{" "}
            <Link
              to="/regex-analysis"
              className="text-set-a underline underline-offset-2 hover:opacity-80"
            >
              regex analysis
            </Link>{" "}
            page for worked examples.
          </>
        ),
      },
    ],
  },
  {
    q: "What's the difference between the RegexSolver engine and the RegexSolver API?",
    a: [
      {
        text: "The RegexSolver engine is the open-source Rust library that implements the core set-algebra algorithms over finite automata; you can use it directly in your own Rust code.",
      },
      {
        text: "The RegexSolver API builds on top of that engine and is exposed as a language-agnostic REST API, callable with any HTTP client, your own wrapper, or our official SDKs (JavaScript/TypeScript, Python, Java).",
      },
      {
        text: "It also adds its own closed-source engine that converts automata back into compact, readable regex patterns, a capability the open-source library does not include.",
      },
    ],
  },
  {
    q: "Which regex syntax is supported? Can I use lookaheads or backreferences?",
    a: [
      {
        text: "RegexSolver supports standard character classes, quantifiers, alternation, and groups: the core constructs of pure regular languages. Patterns are implicitly anchored and always match the full string: abc matches \"abc\" but not \"xabc\" or \"abcx\".",
      },
      {
        text: "Lookaheads, lookbehinds, and backreferences are not supported because they introduce context-sensitivity that makes set operations (intersection, complement, cardinality) undecidable. Keeping to pure regular languages is what makes the mathematical guarantees possible.",
      },
    ],
  },
  {
    q: "Can I chain the output of one operation into another?",
    a: [
      {
        text: "Yes, and this is one of RegexSolver's key strengths. Every compute operation can return a FAIR term (Fast Automaton Internal Representation), a compact binary encoding of the resulting automaton.",
      },
      {
        text: "You can pass FAIR terms directly into subsequent API calls, skipping regex re-parsing and preserving all intermediate state with no overhead.",
      },
    ],
  },
  {
    q: "Is it fast enough for production? Is it vulnerable to ReDoS?",
    a: [
      {
        text: "The core engine is written in Rust and operates on deterministic finite automata, which are immune to catastrophic backtracking (ReDoS) by construction. Every operation runs in bounded time.",
      },
      {
        text: "For high-throughput runtime matching, the recommended pattern is to compute and cache an optimized regex with /analyze/pattern, then match it locally using your language's native engine; the SDKs include a client-side matches() method that does exactly this.",
      },
    ],
  },
  {
    q: "Which languages and platforms are supported?",
    a: [
      {
        text: "RegexSolver exposes a language-agnostic REST API, so any HTTP client works.",
      },
      {
        text: "Official idiomatic SDKs are available for JavaScript/TypeScript (npm), Python (pip), and Java (Maven). All three are open-source and generated from the same OpenAPI spec.",
      },
    ],
  },
  {
    q: "What does the free tier include?",
    a: [
      {
        text: "The free tier covers 10,000 monthly API requests, enough for development, prototyping, and small-scale projects. Signing up requires no payment details of any kind.",
      },
      {
        text: "See the pricing page for the full breakdown of limits.",
        node: (
          <>
            See the{" "}
            <Link
              to="/pricing"
              className="text-set-a underline underline-offset-2 hover:opacity-80"
            >
              pricing page
            </Link>{" "}
            for the full breakdown of limits.
          </>
        ),
      },
    ],
  },
];

/* schema.org FAQPage for the landing page's <JsonLd>. Built from the same
   FAQS the accordion renders, so the two cannot drift. */
export const faqJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a.map((p) => p.text).join("\n\n"),
    },
  })),
});
