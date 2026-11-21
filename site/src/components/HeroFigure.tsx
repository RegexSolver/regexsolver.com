"use client";

import { useEffect } from "react";
import posthog, { analyticsEnabled } from "../lib/posthog";
import { useTypewriter } from "../lib/useTypewriter";
import { generateShortSnippet, type SnippetExample } from "../lib/generateCode";
import { CustomCodeTabs } from "./CustomCodeTabs";
import { Link } from "./ui/Link";
import { findExample, type SectionExample } from "../lib/sections";

/* FIG. 1 — one operation, drawn. Set operations are a Venn diagram in the two
   inks (circle A is pattern A, circle B is pattern B, the shaded region is the
   result). Operations that are not about regions get their own drawing: a dot
   field for cardinality, a ruler of character cells for length, the generated
   strings as tiles, two blocks joined end to end for concatenation, a block
   repeated for repeat. The overlap ink always marks the result, whatever the
   drawing. The active operation is chosen from the legend beside the figure
   (LandingPage owns that state); this component only draws it, shows the SDK
   call and types out the result. Every pattern and result is one of the vetted
   examples in lib/sections.tsx. */

type Layout = "overlap" | "subset" | "same" | "complement" | "single";
type Shade = "lens" | "both" | "a-minus-b" | "a" | "outside";

type Illustration =
  | { kind: "venn"; layout: Layout; shade: Shade }
  | { kind: "count" }
  | { kind: "length"; min: number; max: number }
  | { kind: "strings" }
  | { kind: "concat" }
  | { kind: "repeat"; min: number; max: number };

export type HeroOp = {
  id: string;
  /** The operation's plain name, so nobody has to read set notation (or the
      code) to know what is shown. Legend row and figure caption. */
  name: string;
  /** Legend caption the row sits under: the API's own tag groups. */
  group: "Analyze" | "Compute" | "Generate";
  /** The expression, with A and B in their inks. Legend and caption. */
  notation: React.ReactNode;
  /** One short line for the legend. */
  label: string;
  illustration: Illustration;
  example: SectionExample;
};

const A = <span className="text-set-a">A</span>;
const B = <span className="text-set-b">B</span>;

export const HERO_OPS: HeroOp[] = [
  {
    id: "equivalent",
    name: "Equivalence",
    group: "Analyze",
    notation: (
      <>
        {A} ≡ {B}
      </>
    ),
    label: "Same language?",
    illustration: { kind: "venn", layout: "same", shade: "a" },
    example: findExample("regex-analysis", "equivalent"),
  },
  {
    id: "subset",
    name: "Subset",
    group: "Analyze",
    notation: (
      <>
        {A} ⊆ {B}
      </>
    ),
    label: "Is every match of A a match of B?",
    illustration: { kind: "venn", layout: "subset", shade: "a" },
    example: findExample("regex-analysis", "subset"),
  },
  {
    id: "cardinality",
    name: "Cardinality",
    group: "Analyze",
    notation: <>|{A}|</>,
    label: "Number of strings A matches",
    illustration: { kind: "count" },
    example: findExample("regex-analysis", "cardinality"),
  },
  {
    id: "length",
    name: "Length",
    group: "Analyze",
    notation: <>len({A})</>,
    label: "Shortest and longest match length",
    illustration: { kind: "length", min: 9, max: 10 },
    example: findExample("regex-analysis", "length"),
  },
  {
    id: "intersection",
    name: "Intersection",
    group: "Compute",
    notation: (
      <>
        {A} ∩ {B}
      </>
    ),
    label: "Strings both patterns match",
    illustration: { kind: "venn", layout: "overlap", shade: "lens" },
    example: findExample("pattern-manipulation", "intersection"),
  },
  {
    id: "union",
    name: "Union",
    group: "Compute",
    notation: (
      <>
        {A} ∪ {B}
      </>
    ),
    label: "Strings either pattern matches",
    illustration: { kind: "venn", layout: "overlap", shade: "both" },
    example: findExample("pattern-manipulation", "union"),
  },
  {
    id: "difference",
    name: "Difference",
    group: "Compute",
    notation: (
      <>
        {A} ∖ {B}
      </>
    ),
    label: "Strings A matches and B does not",
    illustration: { kind: "venn", layout: "overlap", shade: "a-minus-b" },
    example: findExample("pattern-manipulation", "difference"),
  },
  {
    id: "complement",
    name: "Complement",
    group: "Compute",
    // Overbar rather than ∁: the code font has no U+2201 (see sections.tsx).
    notation: <span className="overline">{A}</span>,
    label: "Strings A does not match",
    illustration: { kind: "venn", layout: "complement", shade: "outside" },
    example: findExample("pattern-manipulation", "complement"),
  },
  {
    id: "concat",
    name: "Concatenation",
    group: "Compute",
    notation: (
      <>
        {A} · {B}
      </>
    ),
    label: "A followed by B",
    illustration: { kind: "concat" },
    example: findExample("pattern-manipulation", "concat"),
  },
  {
    id: "repeat",
    name: "Repeat",
    group: "Compute",
    notation: (
      <>
        {A}
        {"{n,m}"}
      </>
    ),
    label: "A repeated n to m times",
    illustration: { kind: "repeat", min: 2, max: 4 },
    example: findExample("pattern-manipulation", "repeat"),
  },
  {
    id: "strings",
    name: "String generation",
    group: "Generate",
    notation: (
      <>
        {"{"}s ∈ {A}
        {"}"}
      </>
    ),
    label: "Strings A matches",
    illustration: { kind: "strings" },
    example: findExample("strings-generation", "strings", "[01]{3}"),
  },
];

/* ---- Drawing ------------------------------------------------------------ */

type Circle = { cx: number; cy: number; r: number };
type Point = { x: number; y: number };

/* One viewBox (320 × 200) for every drawing. Within the Venn family the same
   two circles move between layouts instead of being swapped. B is absent for
   complement and the single-set layout: it collapses to a point at A's centre
   and fades, so the transition still has somewhere to go. */
const VIEW = { w: 320, h: 200 };
const GEOMETRY: Record<
  Layout,
  { a: Circle; b: Circle | null; labelA: Point; labelB: Point; universe: boolean }
> = {
  overlap: {
    a: { cx: 125, cy: 100, r: 70 },
    b: { cx: 195, cy: 100, r: 70 },
    labelA: { x: 92, y: 100 },
    labelB: { x: 228, y: 100 },
    universe: false,
  },
  subset: {
    a: { cx: 132, cy: 100, r: 40 },
    b: { cx: 160, cy: 100, r: 82 },
    labelA: { x: 132, y: 100 },
    labelB: { x: 212, y: 60 },
    universe: false,
  },
  same: {
    a: { cx: 160, cy: 100, r: 75 },
    b: { cx: 160, cy: 100, r: 75 },
    labelA: { x: 146, y: 100 },
    labelB: { x: 176, y: 100 },
    universe: false,
  },
  complement: {
    a: { cx: 160, cy: 100, r: 60 },
    b: null,
    labelA: { x: 160, y: 100 },
    labelB: { x: 160, y: 100 },
    universe: true,
  },
  single: {
    a: { cx: 160, cy: 100, r: 75 },
    b: null,
    labelA: { x: 160, y: 100 },
    labelB: { x: 160, y: 100 },
    universe: false,
  },
};

const UNIVERSE = { x: 16, y: 16, width: 288, height: 168 };

/* cx/cy/r are CSS properties for SVG geometry in current browsers, so the
   circles glide between layouts; where they are not, the change is instant.
   The reduced-motion rule in index.css flattens the duration either way. */
const glide = {
  transition:
    "cx 0.45s ease, cy 0.45s ease, r 0.45s ease, opacity 0.45s ease, x 0.45s ease, y 0.45s ease",
} as const;

const MONO = "var(--font-code)";
const INK_A = "var(--set-a)";
const INK_B = "var(--set-b)";
const RESULT = "var(--overlap)";
const MUTE = "var(--mute)";

/* Shared looks: an input block in its ink, the result marked in the overlap
   ink. Dashed strokes mean "optional": a character or repetition that may or
   may not be there. */
const inkBox = (ink: string) => ({
  fill: ink,
  fillOpacity: 0.1,
  stroke: ink,
  strokeWidth: 1.5,
  rx: 3,
});
const dashedBox = (ink: string) => ({
  fill: "none",
  stroke: ink,
  strokeWidth: 1.5,
  strokeDasharray: "4 3",
  rx: 3,
});
const label = (fill: string, size = 12, weight = 500) => ({
  fontFamily: MONO,
  fontSize: size,
  fontWeight: weight,
  fill,
  textAnchor: "middle" as const,
  dominantBaseline: "central" as const,
});

/* A bracket under (or over) a span, with its label: how a result reads on a
   drawing that has no region to shade. */
const Bracket = ({
  x1,
  x2,
  y,
  text,
  above = false,
  ink = RESULT,
}: {
  x1: number;
  x2: number;
  y: number;
  text: string;
  above?: boolean;
  ink?: string;
}) => {
  const tick = above ? 6 : -6;
  return (
    <g>
      <path
        d={`M${x1} ${y + tick} V${y} H${x2} V${y + tick}`}
        fill="none"
        stroke={ink}
        strokeWidth={1.25}
      />
      <text x={(x1 + x2) / 2} y={above ? y - 12 : y + 14} {...label(ink, 11)}>
        {text}
      </text>
    </g>
  );
};

const Venn = ({ layout, shade }: { layout: Layout; shade: Shade }) => {
  const geo = GEOMETRY[layout];
  const a = geo.a;
  const b = geo.b ?? { cx: a.cx, cy: a.cy, r: 0 };
  const shadeProps = { fill: RESULT, fillOpacity: 0.3 } as const;
  const region = (() => {
    switch (shade) {
      case "lens":
        return <circle {...a} {...shadeProps} clipPath="url(#hero-in-b)" />;
      case "both":
        return (
          <>
            <circle {...a} {...shadeProps} />
            <circle {...b} {...shadeProps} />
          </>
        );
      case "a-minus-b":
        return <circle {...a} {...shadeProps} mask="url(#hero-not-b)" />;
      case "a":
        return <circle {...a} {...shadeProps} />;
      case "outside":
        return <rect {...UNIVERSE} {...shadeProps} mask="url(#hero-not-a)" />;
    }
  })();

  return (
    <>
      <defs>
        <clipPath id="hero-in-b">
          <circle {...b} style={glide} />
        </clipPath>
        <mask id="hero-not-b" maskUnits="userSpaceOnUse">
          <rect {...UNIVERSE} fill="white" />
          <circle {...b} fill="black" style={glide} />
        </mask>
        <mask id="hero-not-a" maskUnits="userSpaceOnUse">
          <rect {...UNIVERSE} fill="white" />
          <circle {...a} fill="black" style={glide} />
        </mask>
      </defs>

      {/* Σ*: every string. Only drawn when the result lives outside A. */}
      <g style={{ ...glide, opacity: geo.universe ? 1 : 0 }}>
        <rect
          {...UNIVERSE}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text
          x={UNIVERSE.x + 10}
          y={UNIVERSE.y + 18}
          fontFamily={MONO}
          fontSize={11}
          fill={MUTE}
        >
          Σ*
        </text>
      </g>

      {/* The two inks at partial coverage: the inputs. */}
      <circle
        {...a}
        fill={INK_A}
        fillOpacity={0.1}
        stroke={INK_A}
        strokeWidth={1.5}
        style={glide}
      />
      <circle
        {...b}
        fill={INK_B}
        fillOpacity={0.1}
        stroke={INK_B}
        strokeWidth={1.5}
        style={{ ...glide, opacity: geo.b ? 1 : 0 }}
      />

      {/* The overlap ink: the result. */}
      {region}

      <text
        x={geo.labelA.x}
        y={geo.labelA.y}
        {...label(INK_A, 13)}
        style={glide}
      >
        A
      </text>
      <text
        x={geo.labelB.x}
        y={geo.labelB.y}
        {...label(INK_B, 13)}
        style={{ ...glide, opacity: geo.b ? 1 : 0 }}
      >
        B
      </text>
    </>
  );
};

/* |A|: the language as a field of members, too many to show, hence the last
   row trailing off. The count itself is typed out in the result strip. */
const Count = () => {
  const cols = 12;
  const rows = 5;
  const step = 18;
  const x0 = VIEW.w / 2 - ((cols - 1) * step) / 2;
  const y0 = 56;
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Last row fades out: the field continues past the drawing.
      const last = r === rows - 1;
      if (last && c >= cols - 4) continue;
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={x0 + c * step}
          cy={y0 + r * step}
          r={3}
          fill={RESULT}
          fillOpacity={last ? 0.35 + (cols - 4 - c) * 0.06 : 0.85}
        />,
      );
    }
  }
  return (
    <>
      <rect
        x={40}
        y={30}
        width={240}
        height={140}
        {...inkBox(INK_A)}
        fillOpacity={0.05}
      />
      <text x={56} y={44} {...label(INK_A, 12)}>
        A
      </text>
      {dots}
      <text
        x={x0 + (cols - 3) * step}
        y={y0 + (rows - 1) * step}
        {...label(RESULT, 14)}
      >
        …
      </text>
    </>
  );
};

/* len(A): one character per cell. Solid cells are always there (the shortest
   match), dashed ones may be (up to the longest). */
const Length = ({ min, max }: { min: number; max: number }) => {
  const w = 22;
  const h = 32;
  const gap = 4;
  const total = max * w + (max - 1) * gap;
  const x0 = VIEW.w / 2 - total / 2;
  const y = 84;
  return (
    <>
      <text x={x0 - 14} y={y + h / 2} {...label(INK_A, 13)}>
        A
      </text>
      {Array.from({ length: max }, (_, i) => (
        <rect
          key={i}
          x={x0 + i * (w + gap)}
          y={y}
          width={w}
          height={h}
          {...(i < min ? inkBox(INK_A) : dashedBox(INK_A))}
        />
      ))}
      <Bracket
        x1={x0}
        x2={x0 + min * w + (min - 1) * gap}
        y={y + h + 10}
        text={`min ${min}`}
      />
      <Bracket x1={x0} x2={x0 + total} y={y - 10} text={`max ${max}`} above />
    </>
  );
};

/* {s ∈ A}: the strings themselves, as tiles in the result ink. */
const Strings = ({ result }: { result: string }) => {
  let items: string[] = [];
  try {
    items = JSON.parse(result);
  } catch {
    items = [];
  }
  const cols = 4;
  const w = 62;
  const h = 30;
  const gap = 8;
  const rows = Math.ceil(items.length / cols);
  const x0 = VIEW.w / 2 - (cols * w + (cols - 1) * gap) / 2;
  const y0 = VIEW.h / 2 - (rows * h + (rows - 1) * gap) / 2 + 6;
  return (
    <>
      <text x={x0 + 8} y={y0 - 14} {...label(INK_A, 12)}>
        A
      </text>
      {items.map((s, i) => {
        const x = x0 + (i % cols) * (w + gap);
        const y = y0 + Math.floor(i / cols) * (h + gap);
        return (
          <g key={s}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              {...inkBox(RESULT)}
              fillOpacity={0.12}
            />
            <text x={x + w / 2} y={y + h / 2} {...label(RESULT, 12)}>
              {s}
            </text>
          </g>
        );
      })}
    </>
  );
};

/* A · B: two blocks joined end to end; the bracket spans the whole. */
const Concat = ({ a, b }: { a: string; b: string }) => {
  const y = 78;
  const h = 44;
  const xa = 40;
  const wa = 110;
  const wb = 130;
  return (
    <>
      <text x={xa + wa / 2} y={y - 16} {...label(INK_A, 13)}>
        A
      </text>
      <text x={xa + wa + wb / 2} y={y - 16} {...label(INK_B, 13)}>
        B
      </text>
      <rect x={xa} y={y} width={wa} height={h} {...inkBox(INK_A)} rx={0} />
      <rect x={xa + wa} y={y} width={wb} height={h} {...inkBox(INK_B)} rx={0} />
      <text x={xa + wa / 2} y={y + h / 2} {...label(INK_A, 12)}>
        {a}
      </text>
      <text x={xa + wa + wb / 2} y={y + h / 2} {...label(INK_B, 12)}>
        {b}
      </text>
      <Bracket x1={xa} x2={xa + wa + wb} y={y + h + 10} text="A · B" />
    </>
  );
};

/* A{n,m}: the block n times for sure, then dashed up to m. */
const Repeat = ({ a, min, max }: { a: string; min: number; max: number }) => {
  const w = 60;
  const h = 44;
  const gap = 6;
  const total = max * w + (max - 1) * gap;
  const x0 = VIEW.w / 2 - total / 2;
  const y = 78;
  return (
    <>
      <text x={x0 + w / 2} y={y - 16} {...label(INK_A, 13)}>
        A
      </text>
      {Array.from({ length: max }, (_, i) => {
        const x = x0 + i * (w + gap);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              {...(i < min ? inkBox(INK_A) : dashedBox(INK_A))}
            />
            <text
              x={x + w / 2}
              y={y + h / 2}
              {...label(INK_A, 12)}
              fillOpacity={i < min ? 1 : 0.6}
            >
              {a}
            </text>
          </g>
        );
      })}
      <Bracket
        x1={x0}
        x2={x0 + total}
        y={y + h + 10}
        text={`A{${min},${max}}`}
      />
    </>
  );
};

/* ---- Code ---------------------------------------------------------------- */

/* Same tabs as every other code block on the site (CustomCodeTabs). */
const LANGUAGES = [
  { value: "js", label: "JavaScript", language: "javascript" },
  { value: "java", label: "Java", language: "java" },
  { value: "python", label: "Python", language: "python" },
];

/* The SDK call for the selected operation, from the same generator the live
   demo uses (so method names per language stay right by construction). Its
   variables are renamed to a and b to match the drawing's labels. */
const heroSnippet = (lang: string, example: SectionExample): string => {
  const payload: SnippetExample =
    example.b !== undefined
      ? {
          terms: [
            { type: "regex", value: example.a },
            { type: "regex", value: example.b },
          ],
        }
      : { term: { type: "regex", value: example.a } };
  if (example.demoOp === "strings") {
    payload.limit = Number(example.demoParams?.limit ?? 5);
    payload.offset = Number(example.demoParams?.offset ?? 0);
  }
  if (example.demoOp === "repeat") {
    payload.min = Number(example.demoParams?.min ?? 1);
    payload.max =
      example.demoParams?.max === undefined
        ? null
        : Number(example.demoParams.max);
  }
  return generateShortSnippet(lang, { operationId: example.demoOp! }, payload)
    .replace(/\bterm1\b/g, "a")
    .replace(/\bterm2\b/g, "b")
    .replace(/\bterm\b/g, "a");
};

/* ---- The figure ---------------------------------------------------------- */

const capLabel =
  "font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground";

export const HeroFigure = ({
  op,
  className = "",
}: {
  op: HeroOp;
  className?: string;
}) => {
  const { example, illustration } = op;
  const { out, typing, type } = useTypewriter();

  useEffect(() => {
    type(example.result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op.id]);

  const demoParams = new URLSearchParams({ op: example.demoOp!, a: example.a });
  if (example.b !== undefined) demoParams.set("b", example.b);
  for (const [key, value] of Object.entries(example.demoParams ?? {}))
    demoParams.set(key, String(value));
  const demoHref = `/demo?${demoParams}`;

  const drawing = (() => {
    switch (illustration.kind) {
      case "venn":
        return (
          <Venn layout={illustration.layout} shade={illustration.shade} />
        );
      case "count":
        return <Count />;
      case "length":
        return <Length min={illustration.min} max={illustration.max} />;
      case "strings":
        return <Strings result={example.result} />;
      case "concat":
        return <Concat a={example.a} b={example.b ?? ""} />;
      case "repeat":
        return (
          <Repeat a={example.a} min={illustration.min} max={illustration.max} />
        );
    }
  })();

  return (
    <figure
      className={`border border-rule rounded-(--radius) bg-background flex flex-col ${className}`}
    >
      <div className="flex items-baseline gap-3 px-3.5 py-2.5 border-b border-rule">
        <span className={`${capLabel} whitespace-nowrap`}>FIG. 1</span>
        <figcaption className="flex items-baseline gap-3 mr-auto min-w-0">
          <span className="text-sm font-medium truncate">{op.name}</span>
          {/* Below sm the row has no room for both; the legend row under the
              figure shows the notation. */}
          <span className="hidden sm:inline notation font-mono text-[0.8125rem] whitespace-nowrap">
            {op.notation}
          </span>
        </figcaption>
        <Link
          to={demoHref}
          onClick={() =>
            analyticsEnabled &&
            posthog.capture("try_demo_clicked", {
              source: "hero-figure",
              example: example.demoOp,
            })
          }
          className="font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-set-a hover:underline underline-offset-4 whitespace-nowrap"
        >
          <span className="hidden sm:inline">OPEN IN </span>LIVE DEMO →
        </Link>
      </div>

      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        role="img"
        aria-label={op.label}
        className="w-full h-auto max-h-64 px-4 pt-4"
      >
        {drawing}
      </svg>

      {/* The same operation as SDK code, in the site's standard code tabs.
          The code carries the patterns, so there is no separate readout. Its
          height is pinned to the two-pattern case so one-pattern operations
          do not shorten the figure and shift the page. */}
      <div className="border-t border-rule min-h-[11.65rem]">
        <CustomCodeTabs
          flush
          tabs={LANGUAGES.map((l) => ({
            ...l,
            code: heroSnippet(l.value, example),
          }))}
          onTabChange={(language) =>
            analyticsEnabled &&
            posthog.capture("sdk_language_selected", {
              source: "hero-figure",
              language,
            })
          }
        />
      </div>

      <div
        aria-live="polite"
        className="flex flex-1 items-baseline gap-x-3 gap-y-1 flex-wrap px-3.5 py-2.5 border-t border-rule bg-(--overlap-08) font-mono text-[0.8125rem]"
      >
        <span className={capLabel}>{example.resultLabel}</span>
        {/* The typewriter is visual only: the live region gets the whole
            result once per operation change. */}
        <span className="sr-only">{example.result}</span>
        <span aria-hidden className="is-computed font-medium break-all">
          {out}
          {(typing || !out) && (
            <span className="inline-block w-[0.5em] bg-overlap animate-pulse align-baseline">
              &nbsp;
            </span>
          )}
        </span>
      </div>
    </figure>
  );
};
