/* The operation tables shown on the landing page and on each of the three
   section pages (regex analysis / pattern manipulation / string generation).
   Extracted from LandingPage.tsx so the two cannot drift: the landing page shows
   the curated headline set of every group in one table; a section page shows its
   own group COMPLETE — the base rows plus the *_EXTRA_ROWS, so every operation
   the spec puts under the tag appears on the page that claims to cover it.

   Operation names and what each one answers follow shared/openapi.yaml, the
   vocabulary source of truth. Each row's `doc` anchor is a heading on the docs
   site, so renaming that heading breaks the deep link. The colour system
   carries meaning: set-a is input A, set-b is input B, is-computed is reserved
   for results. */

import { Link } from "../components/ui/Link";
import { docs } from "./docs";

export type OpRow = {
  op: string;
  /** Docs-site path (with anchor) of the section documenting this operation. */
  doc: string;
  notation: React.ReactNode;
  answers: string;
  returns: string;
};

const A = <span className="text-set-a">A</span>;
const B = <span className="text-set-b">B</span>;

export const ANALYZE_ROWS: OpRow[] = [
  {
    op: "cardinality",
    doc: "/core-concepts/analyzing-terms#cardinality",
    notation: <>|{A}|</>,
    answers: "How many distinct strings does the pattern match?",
    returns: "count | ∞",
  },
  {
    op: "length",
    doc: "/core-concepts/analyzing-terms#length",
    notation: <>len({A})</>,
    answers: "Shortest and longest possible match.",
    returns: "[min, max]",
  },
  {
    op: "empty / total",
    doc: "/core-concepts/analyzing-terms#empty",
    notation: (
      <>
        {A} = ∅&ensp;·&ensp;{A} = Σ*
      </>
    ),
    answers: "Matches nothing at all? Matches everything?",
    returns: "boolean",
  },
  {
    op: "equivalent",
    doc: "/core-concepts/equivalence-subset#equivalent",
    notation: (
      <>
        {A} ≡ {B}
      </>
    ),
    answers: "Same language, regardless of syntax?",
    returns: "boolean",
  },
  {
    op: "subset",
    doc: "/core-concepts/equivalence-subset#subset",
    notation: (
      <>
        {A} ⊆ {B}
      </>
    ),
    answers: "Is every match of A also a match of B?",
    returns: "boolean",
  },
  {
    op: "pattern",
    doc: "/core-concepts/terms-format#getting-the-regex-pattern",
    notation: <>re({A})</>,
    answers: "A compact, human-readable regex for any term.",
    returns: "regex",
  },
];

export const COMPUTE_ROWS: OpRow[] = [
  {
    op: "intersection",
    doc: "/core-concepts/union-intersection-difference#intersection",
    notation: (
      <>
        {A} ∩ {B}
      </>
    ),
    answers: "Strings matching all of the patterns.",
    returns: "term",
  },
  {
    op: "union",
    doc: "/core-concepts/union-intersection-difference#union",
    notation: (
      <>
        {A} ∪ {B}
      </>
    ),
    answers: "Strings matching any of the patterns.",
    returns: "term",
  },
  {
    op: "difference",
    doc: "/core-concepts/union-intersection-difference#difference",
    notation: (
      <>
        {A} ∖ {B}
      </>
    ),
    answers: "Strings in A but not in B.",
    returns: "term",
  },
  {
    op: "complement",
    doc: "/core-concepts/union-intersection-difference#complement",
    // Overbar rather than ∁ — see the note in sections.tsx: the code font has
    // no U+2201 and renders it as a "C".
    notation: <span className="overline">{A}</span>,
    answers: "Every string the pattern does not match.",
    returns: "term",
  },
  {
    op: "concatenation",
    doc: "/core-concepts/concatenation-repetition#concatenation",
    notation: (
      <>
        {A} · {B}
      </>
    ),
    answers: "Patterns joined in sequence.",
    returns: "term",
  },
  {
    op: "repeat",
    doc: "/core-concepts/concatenation-repetition#repeat",
    notation: (
      <>
        {A}
        {"{n,m}"}
      </>
    ),
    answers: "The pattern repeated n to m times.",
    returns: "term",
  },
];

/* The rest of the Analyze tag — real operations, just not headline material,
   so the landing page's curated table leaves them out. */
export const ANALYZE_EXTRA_ROWS: OpRow[] = [
  {
    op: "empty_string",
    doc: "/core-concepts/analyzing-terms#empty-string-only",
    notation: (
      <>
        {A} = {"{ε}"}
      </>
    ),
    answers: "Matches only the empty string?",
    returns: "boolean",
  },
  {
    op: "deterministic",
    doc: "/advance-usage/determinism#checking-determinism",
    notation: <>det({A})</>,
    answers:
      "Is the automaton deterministic? A stable string order requires it.",
    returns: "boolean",
  },
  {
    op: "dot",
    doc: "/core-concepts/terms-format#visualizing-a-term",
    notation: <>dot({A})</>,
    answers: "The automaton as a Graphviz DOT graph, ready to render.",
    returns: "dot",
  },
];

/* The rest of the Compute tag, same idea. */
export const COMPUTE_EXTRA_ROWS: OpRow[] = [
  {
    op: "determinize",
    doc: "/advance-usage/determinism#making-a-term-deterministic",
    notation: <>dfa({A})</>,
    answers:
      "The same language as a deterministic FAIR, for a stable string order.",
    returns: "term",
  },
];

export const GENERATE_ROWS: OpRow[] = [
  {
    op: "strings",
    doc: "/core-concepts/generate-strings#basic-usage",
    notation: (
      <>
        {"{"}s ∈ {A}
        {"}"}
      </>
    ),
    answers: "Distinct strings the pattern matches, paginated by limit/offset.",
    returns: "string[]",
  },
];

export const OpTableRows = ({ rows }: { rows: OpRow[] }) => (
  <>
    {rows.map((row) => (
      <tr key={row.op} className="border-t border-rule">
        <td className="py-2 pr-4 pl-3 font-mono text-sm font-medium whitespace-nowrap">
          <Link
            to={docs(row.doc)}
            className="text-foreground hover:text-set-a hover:underline underline-offset-4"
          >
            {row.op}
          </Link>
        </td>
        <td className="py-2 pr-4 font-mono text-sm whitespace-nowrap notation">
          {row.notation}
        </td>
        <td className="py-2 pr-4 text-sm text-muted-foreground">
          {row.answers}
        </td>
        <td className="py-2 pr-3 font-mono text-sm is-computed whitespace-nowrap text-right">
          {row.returns}
        </td>
      </tr>
    ))}
  </>
);
