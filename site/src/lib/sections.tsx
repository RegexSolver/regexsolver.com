/* The three feature pages. They exist so each of the API's tag groups
   (Analyze / Compute / Generate in shared/openapi.yaml) has one indexable page
   of its own instead of being a row in the landing page's table.

   Slugs are the ones this site used to serve before those pages 404'd and were
   removed, so any surviving external link lands on real content again.

   Every example result is either taken from a vetted source (the
   docs examples) or provable by hand — never invented. Every capability named
   here is one the API documents. Keep it that way. */

import type { SectionSlug } from "./generateCode";
import {
  ANALYZE_EXTRA_ROWS,
  ANALYZE_ROWS,
  COMPUTE_EXTRA_ROWS,
  COMPUTE_ROWS,
  GENERATE_ROWS,
  type OpRow,
} from "./operations";

const A = <span className="text-set-a">A</span>;
const B = <span className="text-set-b">B</span>;

export type SectionExample = {
  /** The developer question this answers — one short line, no prose. */
  title: string;
  a: string;
  b?: string;
  expr: React.ReactNode;
  resultLabel: string;
  result: string;
  /** LiveDemo op + params for the deep link; omitted when the demo cannot
      reproduce the call (e.g. generation's length window). */
  demoOp?: string;
  demoParams?: Record<string, string | number>;
};

export type Section = {
  slug: SectionSlug;
  /** Page eyebrow + breadcrumb/sitelink name. Kept short. */
  title: string;
  /** Browser-tab + SERP + og title. With the " | RegexSolver" template it
      should land at 50-60 chars: Google truncates around 60, and shorter
      wastes the SERP line. */
  metaTitle: string;
  description: string;
  heading: string;
  /** One or two sentences, developer-facing. The examples do the talking. */
  intro: string;
  /** Keep the count EVEN — they render in a 2-column grid on md+, and an odd
      one leaves a half-width card dangling on the last row. */
  examples: SectionExample[];
  rows: OpRow[];
  /** Rendered as a second table where the operation list alone is too thin to
      describe the group (generation is one operation plus its options). */
  parameters?: { name: string; values: string; means: string }[];
  /** Docs pages that go deeper, as paths on the docs site. Together they cover
      every operation in `rows`. Keep the count a multiple of 3 (3-column grid). */
  furtherReading: { label: string; path: string }[];
};

export const SECTIONS: Section[] = [
  {
    slug: "regex-analysis",
    title: "Regex analysis",
    metaTitle: "Regex analysis: count, bound, compare patterns",
    description:
      "Analyze a regex without running it: count the strings it matches, check if two patterns are equivalent, bound lengths.",
    heading: "Analyze regex patterns.",
    intro:
      "Compare two patterns, check containment, count the strings a pattern matches and get its shortest and longest match length. Each answer is computed on the automaton and covers every string the pattern can match.",
    examples: [
      {
        title: "Same language?",
        a: "(abcd|abef)",
        b: "ab(cd|ef)",
        expr: (
          <>
            {A} <span className="notation">≡</span> {B}
          </>
        ),
        resultLabel: "BOOLEAN",
        result: "true",
        demoOp: "equivalent",
      },
      {
        title: "Is every match of A also a match of B?",
        a: "beta-[0-9]{4}",
        b: "(alpha|beta)-[0-9]{4}",
        expr: (
          <>
            {A} <span className="notation">⊆</span> {B}
          </>
        ),
        resultLabel: "BOOLEAN",
        result: "true",
        demoOp: "subset",
      },
      {
        title: "Number of strings the pattern matches",
        a: "[a-f0-9]{5}",
        expr: (
          <>
            <span className="notation">|</span>
            {A}
            <span className="notation">|</span>
          </>
        ),
        resultLabel: "COUNT",
        result: "<Cardinality::Integer(1048576)>",
        demoOp: "cardinality",
      },
      {
        title: "Shortest and longest match length",
        a: "(alpha|beta|prod)-[a-z0-9]{4}",
        expr: <>len({A})</>,
        resultLabel: "RANGE",
        result: "<Length: min=9, max=10>",
        demoOp: "length",
      },
    ],
    rows: [...ANALYZE_ROWS, ...ANALYZE_EXTRA_ROWS],
    furtherReading: [
      {
        label: "Equivalence and Subset",
        path: "/core-concepts/equivalence-subset",
      },
      { label: "Analyzing a Term", path: "/core-concepts/analyzing-terms" },
      {
        label: "Getting the regex pattern",
        path: "/core-concepts/terms-format#getting-the-regex-pattern",
      },
      {
        label: "Visualizing a Term",
        path: "/core-concepts/terms-format#visualizing-a-term",
      },
      {
        label: "Checking determinism",
        path: "/advance-usage/determinism#checking-determinism",
      },
      { label: "All operations", path: "/operations" },
    ],
  },
  {
    slug: "pattern-manipulation",
    title: "Pattern manipulation",
    metaTitle: "Combine, intersect and subtract regex patterns",
    description:
      "Combine or merge multiple regex patterns into one with set algebra: union, intersection, difference and complement.",
    heading: "Combine regex patterns.",
    intro:
      "Intersect, subtract, union or complement patterns as sets. The result is a term you can pass to the next call, or read back as one regex pattern.",
    examples: [
      {
        title: "Strings both patterns match, as one pattern",
        a: "/api/v[12]/.*",
        b: ".*/users/[0-9]+",
        expr: (
          <>
            {A} <span className="notation">∩</span> {B}
          </>
        ),
        resultLabel: "PATTERN",
        result: "/api/v[12]/(.*/)?users/[0-9]+",
        demoOp: "intersection",
      },
      {
        title: "Strings A matches and B does not",
        a: ".*\\.(jpe?g|png|gif)",
        b: ".*\\.gif",
        expr: (
          <>
            {A} <span className="notation">∖</span> {B}
          </>
        ),
        resultLabel: "PATTERN",
        result: ".*\\.(jpe?|pn)g",
        demoOp: "difference",
      },
      {
        title: "Strings either pattern matches",
        a: "[0-4]",
        b: "[3-9]",
        expr: (
          <>
            {A} <span className="notation">∪</span> {B}
          </>
        ),
        resultLabel: "PATTERN",
        result: "[0-9]",
        demoOp: "union",
      },
      {
        title: "Strings the pattern does not match",
        a: "[a-z]*",
        // Overbar, not ∁: the code font has no U+2201 and substitutes a plain
        // "C", so `∁A` renders as the word "CA". An overline is the same
        // notation and needs no glyph at all.
        expr: <span className="overline">{A}</span>,
        resultLabel: "PATTERN",
        result: ".*[^a-z].*",
        demoOp: "complement",
      },
      // The two below are from the docs page on concatenation and repetition:
      // ab · c.* · de prints abc.*de there (here the last two are one term),
      // and abc repeated {2,4} prints (abc){2,4}.
      {
        title: "A followed by B",
        a: "ab",
        b: "c.*de",
        expr: (
          <>
            {A} · {B}
          </>
        ),
        resultLabel: "PATTERN",
        result: "abc.*de",
        demoOp: "concat",
      },
      {
        title: "A repeated 2 to 4 times",
        a: "abc",
        expr: (
          <>
            {A}
            {"{2,4}"}
          </>
        ),
        resultLabel: "PATTERN",
        result: "(abc){2,4}",
        demoOp: "repeat",
        demoParams: { min: 2, max: 4 },
      },
    ],
    rows: [...COMPUTE_ROWS, ...COMPUTE_EXTRA_ROWS],
    furtherReading: [
      {
        label: "Union, Intersection, Difference and Complement",
        path: "/core-concepts/union-intersection-difference",
      },
      {
        label: "Concatenation and Repetition",
        path: "/core-concepts/concatenation-repetition",
      },
      {
        label: "Making a Term deterministic",
        path: "/advance-usage/determinism#making-a-term-deterministic",
      },
      { label: "Term's Format", path: "/core-concepts/terms-format" },
      { label: "Heavy Operations", path: "/advance-usage/heavy-operations" },
      { label: "Auto-Batching", path: "/advance-usage/auto-batching" },
    ],
  },
  {
    slug: "strings-generation",
    title: "String generation",
    metaTitle: "String generation: test data from a regex",
    description:
      "Generate strings matching a regex: distinct, deterministic, paginated results, with length and character-set bounds.",
    heading: "Generate strings from a regex.",
    intro:
      "Distinct strings that match a pattern, in a fixed order, paginated with limit and offset, with optional length and character-set bounds.",
    examples: [
      {
        title: "Strings the pattern matches",
        a: "(alpha|beta|prod)-[a-z0-9]{4}",
        expr: <>strings({A}, limit: 5)</>,
        resultLabel: "STRINGS",
        result:
          '["beta-0000", "beta-0001", "beta-0002", "beta-0003", "beta-0004"]',
        demoOp: "strings",
        demoParams: { limit: 5, offset: 0 },
      },
      {
        title: "Page through the results with offset",
        a: "(abc|de){2}",
        expr: <>strings({A}, limit: 2, offset: 2)</>,
        resultLabel: "STRINGS",
        result: '["abcde", "abcabc"]',
        demoOp: "strings",
        demoParams: { limit: 2, offset: 2 },
      },
      {
        title: "Only strings within a length window",
        a: "(ab|cde)*",
        expr: <>strings({A}, limit: 5, minLength: 4, maxLength: 6)</>,
        resultLabel: "STRINGS",
        result: '["abab", "cdeab", "abcde", "ababab", "cdecde"]',
        // No demo link: the live demo exposes limit/offset but not the
        // length-window options.
      },
      {
        title: "Every string of a finite pattern",
        a: "[01]{3}",
        expr: <>strings({A}, limit: 8)</>,
        resultLabel: "STRINGS",
        result: '["000", "001", "010", "011", "100", "101", "110", "111"]',
        demoOp: "strings",
        demoParams: { limit: 8, offset: 0 },
      },
    ],
    rows: GENERATE_ROWS,
    parameters: [
      {
        name: "limit",
        values: "1 to 100",
        means:
          "Maximum number of distinct strings to return in the call. The example cards above and the live demo cap it at 10.",
      },
      {
        name: "offset",
        values: "integer",
        means: "Strings to skip before collecting, which is how you paginate.",
      },
      {
        name: "minLength",
        values: "integer",
        means:
          "Lower bound of the length window; excluded strings never consume offset positions.",
      },
      {
        name: "maxLength",
        values: "integer",
        means: "Upper bound of the length window.",
      },
      {
        name: "pathOrder",
        values: "sweep · interleave · shuffled",
        means: "Which paths of the language are expanded first.",
      },
      {
        name: "characterOrder",
        values: "ascending · shuffled",
        means: "How each position is filled from its character range.",
      },
      {
        name: "seed",
        values: "integer",
        means:
          "Draws both shuffled orders, so a shuffled run stays reproducible.",
      },
      {
        name: "charset",
        values: "character class",
        means:
          "Restricts generation to a character class such as [a-z]; paths needing anything else are dropped.",
      },
    ],
    furtherReading: [
      { label: "Generate Strings", path: "/core-concepts/generate-strings" },
      {
        label: "String Generation Ordering",
        path: "/advance-usage/generation-ordering",
      },
      { label: "Determinism", path: "/advance-usage/determinism" },
    ],
  },
];

export const sectionBySlug = (slug: string): Section => {
  const section = SECTIONS.find((s) => s.slug === slug);
  if (!section) throw new Error(`Unknown section: ${slug}`);
  return section;
};

/* One vetted example by operation (and, where a section has several of the
   same operation, by pattern). The landing page builds its cards and its hero
   figure from these, so the two never show a result this file has not vetted. */
export const findExample = (
  slug: SectionSlug,
  demoOp: string,
  pattern?: string,
): SectionExample => {
  const found = sectionBySlug(slug).examples.find(
    (e) => e.demoOp === demoOp && (pattern === undefined || e.a === pattern),
  );
  if (!found) throw new Error(`No ${demoOp} example in ${slug}`);
  return found;
};
