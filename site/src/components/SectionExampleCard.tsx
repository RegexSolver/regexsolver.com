"use client";

import { useMemo, useState } from "react";
import posthog, { analyticsEnabled } from "../lib/posthog";
import { useTypewriter } from "../lib/useTypewriter";
import { Link } from "./ui/Link";
import type { SectionExample } from "../lib/sections";
import { EngineUnavailableError, compute } from "../lib/engine";

/* A worked example that runs. The vetted precomputed result is the initial
   (and prerendered) state; the patterns are editable and COMPUTE runs the
   edited call in the browser, on the same engine as the live demo page. Examples
   without a demoOp render read-only, exactly as before. */

const A_SPAN = <span className="text-set-a">A</span>;
const B_SPAN = <span className="text-set-b">B</span>;

const BINARY_SYMBOL: Record<string, string> = {
  equivalent: "≡",
  subset: "⊆",
  intersection: "∩",
  union: "∪",
  difference: "∖",
  concat: "·",
};

const capLabel =
  "font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground";
const patternInput =
  "w-full min-w-0 rounded-[2px] border border-rule bg-background px-2 py-1 font-mono text-[0.8125rem] transition-colors focus:border-set-a";
/* A read-only pattern keeps the input's box — same padding, same border width,
   just transparent — so its row is exactly as tall as an editable one and the
   text starts on the same x. Without it a read-only card rides up out of line
   with the runnable card beside it. */
const patternStatic =
  "min-w-0 rounded-[2px] border border-transparent px-2 py-1 break-all";
/* Spinners off: they eat a third of a 2-digit field's width and read as noise
   at this size. The values are typed, and both fields still enforce min/max. */
const numberInput =
  "w-10 rounded-[2px] border border-rule bg-background px-1.5 py-0.5 font-mono text-[0.75rem] text-foreground transition-colors focus:border-set-a [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
/* Everything that decides the button's HEIGHT, shared with the spacer below so
   the two are identical to the pixel. `ml-auto` keeps it right-aligned even on
   a wrapped line (a lone item on a wrapped `justify-between` line falls left).
   Border WIDTH only — the colour stays on the button, because two colour
   utilities on one element is a coin flip: stylesheet order wins, not class
   order. */
const computeBox =
  "ml-auto font-mono text-[0.6875rem] font-medium tracking-[0.08em] py-1.5 rounded-(--radius) border";
/* The read-only card's stand-in. Zero WIDTH (so a long expression still gets
   the whole row and stays on one line) but the full height, which is the only
   thing being reserved. px-0 rather than the button's px-3: under border-box a
   w-0 box still can't shrink below its own padding. */
const computeSpacer = `${computeBox} hidden md:block invisible w-0 px-0 overflow-hidden whitespace-nowrap`;

/* The /demo request body — also the identity of a run, which is why it is one
   function: the thing compared has to be exactly the thing sent. */
const requestBody = (
  example: SectionExample,
  a: string,
  b: string,
  limit: number,
  offset: number,
  min: number,
  max: number,
) =>
  JSON.stringify({
    operation: example.demoOp,
    regex1: a,
    regex2: example.b !== undefined ? b : undefined,
    // Pin the order the precomputed results use, so an untouched COMPUTE
    // reproduces exactly what the card already shows.
    ...(example.demoOp === "strings"
      ? { limit, offset, pathOrder: "sweep", characterOrder: "ascending" }
      : {}),
    ...(example.demoOp === "repeat" ? { min, max } : {}),
  });

export const SectionExampleCard = ({
  example,
  source,
  alignSecondPattern = false,
  alignCompute = false,
}: {
  example: SectionExample;
  source: string;
  /** The card beside this one in the grid has a B pattern / a COMPUTE button
      and this one does not: hold that space open so the two stay in line.
      Both are decided by the grid (SectionPage), never by the card. */
  alignSecondPattern?: boolean;
  alignCompute?: boolean;
}) => {
  const runnable = Boolean(example.demoOp);
  const isStrings = example.demoOp === "strings";
  const isRepeat = example.demoOp === "repeat";

  const initialLimit = Number(example.demoParams?.limit ?? 5);
  const initialOffset = Number(example.demoParams?.offset ?? 0);
  const initialMin = Number(example.demoParams?.min ?? 1);
  const initialMax = Number(example.demoParams?.max ?? 1);

  const [a, setA] = useState(example.a);
  const [b, setB] = useState(example.b ?? "");
  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(initialOffset);
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);
  // Inputs no longer match the vetted result — hide it until COMPUTE.
  const [edited, setEdited] = useState(false);
  const [computed, setComputed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /* Every answer this card has ever had, keyed by the request that produced
     it. Same inputs → same result, so a repeat COMPUTE replays instead of
     asking again (LiveDemo's lastParams guard, but remembering more than the
     last one — going back to a pattern you already ran costs nothing either).

     SEEDED with the example's own vetted result, because the card is ALREADY
     displaying it: the untouched inputs have a known answer, so the first
     COMPUTE has nothing to ask. A card costs zero requests until someone
     edits it to something genuinely new.

     Held in state purely to make it per-card and lazily built; it is mutated
     in place, never replaced, so writing to it does not re-render. */
  const [answers] = useState(
    () =>
      new Map<string, { text: string | null; error: string | null }>(
        runnable
          ? [
              [
                requestBody(
                  example,
                  example.a,
                  example.b ?? "",
                  initialLimit,
                  initialOffset,
                  initialMin,
                  initialMax,
                ),
                { text: example.result, error: null },
              ],
            ]
          : [],
      ),
  );
  const { out, typing, type, reset } = useTypewriter();

  const edit =
    <T,>(set: (v: T) => void) =>
    (value: T) => {
      set(value);
      setEdited(true);
      setComputed(false);
      setError(null);
      reset();
    };
  const setAEdited = edit(setA);
  const setBEdited = edit(setB);
  const setLimitEdited = edit(setLimit);
  const setOffsetEdited = edit(setOffset);
  const setMinEdited = edit(setMin);
  const setMaxEdited = edit(setMax);

  const currentParams = useMemo(
    () => requestBody(example, a, b, limit, offset, min, max),
    [example, a, b, limit, offset, min, max],
  );

  /* A known answer, played back as a compute: COMPUTING… for about as long as
     the round trip it stands in for, then the result types itself out again.
     Identical to a real run from the outside — the button can be hammered all
     day and the network stays silent. */
  const replay = async (text: string | null, failure: string | null) => {
    setLoading(true);
    setError(null);
    setComputed(false);
    reset();
    await new Promise((r) => setTimeout(r, 180 + Math.random() * 220));
    setLoading(false);
    if (failure !== null) {
      setError(failure);
      return;
    }
    if (text !== null) {
      setComputed(true);
      type(text, 100);
    }
  };

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const known = answers.get(currentParams);
    if (known) {
      await replay(known.text, known.error);
      if (analyticsEnabled)
        posthog.capture("section_example_run", {
          source,
          operation: example.demoOp,
          edited,
          // Engagement still counts; it just was not recomputed.
          cached: true,
        });
      return;
    }

    try {
      new RegExp(a);
      if (example.b !== undefined) new RegExp(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    setLoading(true);
    setError(null);
    setComputed(false);
    reset();
    try {
      const data = await compute(currentParams);
      const value: unknown = data.value;
      const text = Array.isArray(value)
        ? `[${value.map((v) => JSON.stringify(v)).join(", ")}]`
        : String(value);
      answers.set(currentParams, { text, error: null });
      setComputed(true);
      type(text, 100);
      if (analyticsEnabled)
        posthog.capture("section_example_run", {
          source,
          operation: example.demoOp,
          result_type: data.type,
          edited,
          cached: false,
        });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Failed to compute operation";
      // The engine answered (an error stands for these inputs); an engine
      // that failed to load records nothing, so a retry still goes through.
      if (!(err instanceof EngineUnavailableError))
        answers.set(currentParams, { text: null, error: message });
      setError(message);
      if (analyticsEnabled)
        posthog.capture("section_example_failed", {
          source,
          operation: example.demoOp,
          error_message: message,
        });
    } finally {
      setLoading(false);
    }
  };

  /* Deep link into the live demo carrying the CURRENT inputs — same URL
     shape LiveDemo parses (op/a/b/limit/offset). */
  const demoHref = (() => {
    if (!example.demoOp) return null;
    const params = new URLSearchParams({ op: example.demoOp, a });
    if (example.b !== undefined) params.set("b", b);
    if (isStrings) {
      params.set("limit", String(limit));
      params.set("offset", String(offset));
    }
    if (isRepeat) {
      params.set("min", String(min));
      params.set("max", String(max));
    }
    return `/demo?${params}`;
  })();

  /* The expression, rebuilt around the live inputs for runnable ops; the
     hand-written node from sections.tsx for read-only cards. */
  const expression = (() => {
    if (!runnable) return example.expr;
    const op = example.demoOp!;
    if (BINARY_SYMBOL[op])
      return (
        <>
          {A_SPAN} <span className="notation">{BINARY_SYMBOL[op]}</span>{" "}
          {B_SPAN}
        </>
      );
    if (op === "cardinality")
      return (
        <>
          <span className="notation">|</span>
          {A_SPAN}
          <span className="notation">|</span>
        </>
      );
    if (op === "length") return <>len({A_SPAN})</>;
    if (op === "repeat")
      return (
        /* Same nbsp trick as strings below: the spacing lives in the text. */
        <span className="inline-flex items-baseline flex-wrap gap-y-1">
          {A_SPAN}
          {"{"}
          <input
            type="number"
            min={0}
            max={10}
            value={min}
            onChange={(e) => setMinEdited(parseInt(e.target.value) || 0)}
            aria-label="Minimum repetitions"
            className={numberInput}
          />
          {",\u00a0"}
          <input
            type="number"
            min={0}
            max={10}
            value={max}
            onChange={(e) => setMaxEdited(parseInt(e.target.value) || 0)}
            aria-label="Maximum repetitions"
            className={numberInput}
          />
          {"}"}
        </span>
      );
    if (op === "strings")
      return (
        /* No gap-x: in a flex row EVERY child is an item, including each run
           of text, so a gap lands on both sides of every comma and bracket —
           that is where the "strings( A , limit:" spacing came from. The
           spacing lives in the text itself now (nbsp before each field), which
           both reads correctly and buys back the ~24px that was pushing
           COMPUTE onto a line of its own. */
        <span className="inline-flex items-baseline flex-wrap gap-y-1">
          {"strings("}
          {A_SPAN}
          {", limit:\u00a0"}
          <input
            type="number"
            min={1}
            max={10}
            value={limit}
            onChange={(e) => setLimitEdited(parseInt(e.target.value) || 1)}
            aria-label="Limit"
            className={numberInput}
          />
          {", offset:\u00a0"}
          <input
            type="number"
            min={0}
            max={10}
            value={offset}
            onChange={(e) => setOffsetEdited(parseInt(e.target.value) || 0)}
            aria-label="Offset"
            className={numberInput}
          />
          {")"}
        </span>
      );
    return example.expr;
  })();

  return (
    <form
      onSubmit={run}
      className="border border-rule rounded-(--radius) bg-background flex flex-col"
    >
      <div className="flex items-baseline justify-between gap-3 px-3.5 py-2.5 border-b border-rule">
        <span className="text-[0.8125rem] text-muted-foreground">
          {example.title}
        </span>
        {demoHref && (
          <Link
            to={demoHref}
            onClick={() =>
              analyticsEnabled &&
              posthog.capture("try_demo_clicked", {
                source,
                example: example.demoOp,
              })
            }
            className="font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-set-a hover:underline underline-offset-4 whitespace-nowrap"
          >
            OPEN IN LIVE DEMO →
          </Link>
        )}
      </div>

      <div className="p-3.5 font-mono text-[0.8125rem] leading-relaxed">
        <div className="space-y-1.5">
          <div className="flex items-center gap-x-2">
            <span className="text-muted-foreground shrink-0">A&ensp;=</span>
            {runnable ? (
              <input
                value={a}
                onChange={(e) => setAEdited(e.target.value)}
                spellCheck={false}
                aria-label="Pattern A"
                className={`${patternInput} text-set-a`}
              />
            ) : (
              <span className={`${patternStatic} text-set-a`}>{example.a}</span>
            )}
          </div>
          {example.b !== undefined ? (
            <div className="flex items-center gap-x-2">
              <span className="text-muted-foreground shrink-0">B&ensp;=</span>
              {runnable ? (
                <input
                  value={b}
                  onChange={(e) => setBEdited(e.target.value)}
                  spellCheck={false}
                  aria-label="Pattern B"
                  className={`${patternInput} text-set-b`}
                />
              ) : (
                <span className={`${patternStatic} text-set-b`}>
                  {example.b}
                </span>
              )}
            </div>
          ) : (
            alignSecondPattern && (
              /* Empty, invisible copy of the row: a real input, so the height
                 reserved is exactly a pattern row's, and visibility:hidden
                 keeps it out of the tab order and the a11y tree. Only from md,
                 where the grid is two columns — stacked, there is no partner
                 to line up with. */
              <div className="hidden md:flex items-center gap-x-2 invisible">
                <span className="shrink-0">B&ensp;=</span>
                <input readOnly tabIndex={-1} className={patternInput} />
              </div>
            )
          )}
        </div>

        <div className="border-t border-rule mt-2.5 pt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {/* The expression is ONE flex item, so gap-x-2 only ever separates it
              from the arrow. Left as a bare child, each of its text runs became
              an item too and the gap landed inside the notation —
              "strings( A , limit:", "len( A )", "| A |". */}
          <span className="flex items-baseline gap-x-2">
            <span>{expression}</span>
            <span className="text-muted-foreground notation">→</span>
          </span>
          {runnable ? (
            <button
              type="submit"
              disabled={loading}
              className={`${computeBox} px-3 cursor-pointer border-overlap bg-overlap text-paper hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-default`}
            >
              {loading ? "COMPUTING…" : "COMPUTE"}
            </button>
          ) : (
            alignCompute && (
              /* Read-only card next to a runnable one: same reservation as the
                 B row above, for the button's line. */
              <span className={computeSpacer}>COMPUTE</span>
            )
          )}
        </div>
      </div>

      {/* `flex-1` lives HERE, not on the body above. Grid rows stretch every
          card to the tallest one, and that slack has to go somewhere: on the
          body it opened a gap ABOVE the result, so a 1-line result sat lower
          than the 2-line result beside it. On the strip, the slack falls below
          the text — every result strip in a row now starts at the same y and
          the band simply runs to the bottom of the card. */}
      <div
        aria-live="polite"
        className={`flex flex-1 content-start items-baseline gap-x-3 gap-y-1 flex-wrap px-3.5 py-2.5 border-t border-rule font-mono text-[0.8125rem] ${
          error ? "bg-(--set-b-05)" : "bg-(--overlap-08)"
        }`}
      >
        {error ? (
          <>
            <span className={`${capLabel} text-set-b!`}>ERROR</span>
            <span className="text-set-b break-all">{error}</span>
          </>
        ) : (
          <>
            <span className={capLabel}>{example.resultLabel}</span>
            {computed || typing ? (
              <>
                {/* The typewriter is visual only: the live region announces
                    the full answer once, from the same map the replay reads. */}
                <span className="sr-only">
                  {answers.get(currentParams)?.text}
                </span>
                <span aria-hidden className="is-computed font-medium break-all">
                  {out}
                  {typing && (
                    <span className="inline-block w-[0.5em] bg-overlap animate-pulse align-baseline">
                      &nbsp;
                    </span>
                  )}
                </span>
              </>
            ) : edited || loading ? (
              <span
                className="inline-block w-[0.5em] self-stretch bg-overlap animate-pulse"
                aria-hidden
              >
                &nbsp;
              </span>
            ) : (
              <span className="is-computed font-medium break-all">
                {example.result}
              </span>
            )}
          </>
        )}
      </div>
    </form>
  );
};
