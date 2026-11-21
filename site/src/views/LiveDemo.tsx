"use client";

import React, { useState, useMemo, useEffect } from "react";
import posthog, { analyticsEnabled } from "../lib/posthog";
import { useTypewriter } from "../lib/useTypewriter";
import { type SnippetExample, generateFullSnippet } from "../lib/generateCode";
import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CustomCodeTabs } from "../components/CustomCodeTabs";
import { DotGraph } from "../components/DotGraph";
import { Link } from "../components/ui/Link";
import { docs } from "../lib/docs";
import { EngineUnavailableError, compute, preloadEngine } from "../lib/engine";

/* Each operation carries a generic one-line description and a worked example
   (from shared/openapi.yaml). The example only prefills the initial state and
   ?op= deep links without inputs — switching operations keeps whatever the
   user has typed. */
const PATH_ORDERS = ["sweep", "interleave", "shuffled"] as const;
const CHARACTER_ORDERS = ["ascending", "shuffled"] as const;
type PathOrder = (typeof PATH_ORDERS)[number];
type CharacterOrder = (typeof CHARACTER_ORDERS)[number];

type Op = {
  value: string;
  label: string;
  group: "Analyze" | "Compute" | "Generate";
  args: 1 | 2;
  extra?: "repeat" | "strings";
  input1Label: string;
  input2Label?: string;
  example: {
    regex1: string;
    regex2?: string;
    min?: number;
    max?: number | "";
    limit?: number;
    offset?: number;
    pathOrder?: PathOrder;
    characterOrder?: CharacterOrder;
  };
  hint: string;
};

const OPS: Op[] = [
  {
    value: "cardinality",
    label: "Cardinality",
    group: "Analyze",
    args: 1,
    input1Label: "Pattern",
    example: { regex1: "[a-z]" },
    hint: "Counts how many distinct strings the pattern matches: a number, or \u221e.",
  },
  {
    value: "dot",
    label: "Automaton graph",
    group: "Analyze",
    args: 1,
    input1Label: "Pattern",
    example: { regex1: "(abc|de)+" },
    hint: "Draws the automaton behind the pattern: circles are states, double circles accept, edges are the characters read.",
  },
  {
    value: "equivalent",
    label: "Equivalent",
    group: "Analyze",
    args: 2,
    input1Label: "Pattern A",
    input2Label: "Pattern B",
    example: { regex1: "(abcd|abef)", regex2: "ab(cd|ef)" },
    hint: "Checks whether two patterns match exactly the same set of strings, regardless of syntax.",
  },
  {
    value: "length",
    label: "Length",
    group: "Analyze",
    args: 1,
    input1Label: "Pattern",
    example: { regex1: "(abc)?d" },
    hint: "Returns the length of the shortest and the longest string the pattern matches.",
  },
  {
    value: "subset",
    label: "Subset",
    group: "Analyze",
    args: 2,
    input1Label: "Pattern A (subset)",
    input2Label: "Pattern B (superset)",
    example: { regex1: "de", regex2: "(abc|de)" },
    hint: "Checks whether every string A matches is also matched by B.",
  },

  {
    value: "intersection",
    label: "Intersection",
    group: "Compute",
    args: 2,
    input1Label: "Pattern A",
    input2Label: "Pattern B",
    example: { regex1: "/api/v[12]/.*", regex2: ".*/users/[0-9]+" },
    hint: "Computes one pattern matching exactly the strings that both patterns accept.",
  },
  {
    value: "union",
    label: "Union",
    group: "Compute",
    args: 2,
    input1Label: "Pattern A",
    input2Label: "Pattern B",
    example: { regex1: "ab", regex2: "cd" },
    hint: "Computes one pattern matching the strings that either pattern accepts.",
  },
  {
    value: "difference",
    label: "Difference",
    group: "Compute",
    args: 2,
    input1Label: "Pattern A (base)",
    input2Label: "Pattern B (to subtract)",
    example: { regex1: "(ab|cd)", regex2: "cd" },
    hint: "Computes what remains of A after removing every string B matches.",
  },
  {
    value: "complement",
    label: "Complement",
    group: "Compute",
    args: 1,
    input1Label: "Pattern",
    example: { regex1: ".*a.*" },
    hint: "Computes a pattern matching every string the input pattern does not match.",
  },
  {
    value: "concat",
    label: "Concatenation",
    group: "Compute",
    args: 2,
    input1Label: "Pattern A (first)",
    input2Label: "Pattern B (second)",
    example: { regex1: "/api/", regex2: "v[12]/users" },
    hint: "Joins the patterns in sequence into a single pattern.",
  },
  {
    value: "repeat",
    label: "Repeat",
    group: "Compute",
    args: 1,
    extra: "repeat",
    input1Label: "Pattern",
    example: { regex1: "abc", min: 3, max: "" },
    hint: "Repeats the pattern between min and max times; leave max empty for unbounded.",
  },

  {
    value: "strings",
    label: "Generate strings",
    group: "Generate",
    args: 1,
    extra: "strings",
    input1Label: "Pattern",
    example: {
      regex1: "(alpha|beta|prod)-[a-z0-9]{4}",
      limit: 10,
      offset: 0,
      pathOrder: "sweep",
      characterOrder: "ascending",
    },
    hint: "Generates distinct strings the pattern matches. Path order picks which shapes come first; character order picks the characters that fill them. The demo caps limit and offset at 10; the API allows a limit up to 100.",
  },
];

const DEFAULT_OP = OPS.find((o) => o.value === "intersection")!;

const capLabel =
  "font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground";
const inputBase =
  "h-11 rounded-[var(--radius)] border border-rule bg-background px-3 py-2 text-sm font-mono transition-colors focus:border-set-a";

/* appearance-none strips the native dropdown arrow, so every <select> carries
   its own — without it the control is indistinguishable from a text input. */
const selectChevron = (
  <ChevronDown
    aria-hidden
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
  />
);

/* Generated strings render as one chip per string, revealed left to right in
   generation order — the order IS the feature being demonstrated. Quoted via
   JSON.stringify so the empty string, spaces and escapes stay visible. */
const StringsReadout = ({ values }: { values: string[] }) => {
  const [shown, setShown] = useState(0);
  // Restarts the typewriter whenever `values` changes; the reset is the point.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(values.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= values.length) window.clearInterval(id);
    }, 70);
    return () => window.clearInterval(id);
  }, [values]);

  if (values.length === 0)
    return (
      <span className="text-muted-foreground">
        no strings: nothing matches within these bounds
      </span>
    );

  return (
    <>
      {/* The reveal is visual only: the enclosing readout is a live region,
          so this full list is announced once while the chips stay hidden
          from the accessibility tree. */}
      <span className="sr-only">
        {values.map((s) => JSON.stringify(s)).join(", ")}
      </span>
      <span aria-hidden className="flex flex-wrap gap-x-2 gap-y-1.5 min-w-0">
        {values.slice(0, shown).map((s, i) => (
          <span
            key={i}
            className="is-computed font-medium break-all rounded-[2px] border border-rule bg-background px-1.5 py-0.5"
          >
            {JSON.stringify(s)}
          </span>
        ))}
        {shown < values.length && (
          <span className="inline-block w-[0.5em] bg-overlap animate-pulse">
            &nbsp;
          </span>
        )}
      </span>
    </>
  );
};

export const LiveDemo = () => {
  const [operation, setOperation] = useState(DEFAULT_OP.value);
  const [regex1, setRegex1] = useState(DEFAULT_OP.example.regex1);
  const [regex2, setRegex2] = useState(DEFAULT_OP.example.regex2 ?? "");

  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number | "">("");
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [pathOrder, setPathOrder] = useState<PathOrder>("sweep");
  const [characterOrder, setCharacterOrder] =
    useState<CharacterOrder>("ascending");

  const [result, setResult] = useState<{
    type: string;
    value: string | string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // COPY → COPIED, same 2s acknowledgement as the code tabs below.
  const [copied, setCopied] = useState(false);
  /* Every answer this session has produced, keyed by the request that produced
     it. Same inputs → same result, so a repeat COMPUTE replays the answer
     instead of asking again — including going back to something computed
     earlier. Mutated in place, never replaced, so writing to it does not
     re-render; what is on screen lives in `result`/`error` as before. */
  const [answers] = useState(
    () =>
      new Map<
        string,
        {
          data: { type: string; value: string | string[] } | null;
          error: string | null;
        }
      >(),
  );
  // The URL owns the state until it has been read once; writing back before
  // that would clobber an incoming deep link with the defaults.
  const [urlLoaded, setUrlLoaded] = useState(false);

  const activeOp = useMemo(
    () => OPS.find((o) => o.value === operation)!,
    [operation],
  );

  // Shareable URLs: /demo?op=intersection&a=…&b=… — read on mount (static
  // export, so query params are only available client-side)…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const op = OPS.find((o) => o.value === params.get("op"));
    if (op) {
      const int = (key: string, fallback: number) => {
        const n = parseInt(params.get(key) ?? "", 10);
        return Number.isFinite(n) ? n : fallback;
      };
      const enumParam = <T extends string>(
        key: string,
        allowed: readonly T[],
        fallback: T,
      ): T => {
        const v = params.get(key);
        return (allowed as readonly string[]).includes(v ?? "")
          ? (v as T)
          : fallback;
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOperation(op.value);
      setRegex1(params.get("a") ?? op.example.regex1);
      setRegex2(params.get("b") ?? op.example.regex2 ?? "");
      setMin(int("min", op.example.min ?? 1));
      setMax(params.get("max") ? int("max", 0) : (op.example.max ?? ""));
      setLimit(int("limit", op.example.limit ?? 10));
      setOffset(int("offset", op.example.offset ?? 0));
      setPathOrder(
        enumParam("pathOrder", PATH_ORDERS, op.example.pathOrder ?? "sweep"),
      );
      setCharacterOrder(
        enumParam(
          "characterOrder",
          CHARACTER_ORDERS,
          op.example.characterOrder ?? "ascending",
        ),
      );
    }
    setUrlLoaded(true);
    // The engine and its model load while the visitor reads the form.
    preloadEngine();
  }, []);

  // …and written back on every change, so the current inputs can be shared
  // by copying the address bar (replaceState: no history spam while typing).
  useEffect(() => {
    if (!urlLoaded) return;
    const params = new URLSearchParams();
    params.set("op", operation);
    params.set("a", regex1);
    if (activeOp.args === 2) params.set("b", regex2);
    if (activeOp.extra === "repeat") {
      params.set("min", String(min));
      if (max !== "") params.set("max", String(max));
    }
    if (activeOp.extra === "strings") {
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      params.set("pathOrder", pathOrder);
      params.set("characterOrder", characterOrder);
    }
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  }, [
    urlLoaded,
    operation,
    regex1,
    regex2,
    min,
    max,
    limit,
    offset,
    pathOrder,
    characterOrder,
    activeOp,
  ]);

  const currentParams = useMemo(() => {
    return JSON.stringify({
      operation,
      regex1,
      regex2: activeOp.args === 2 ? regex2 : undefined,
      min: activeOp.extra === "repeat" ? min : undefined,
      max: activeOp.extra === "repeat" ? (max === "" ? null : max) : undefined,
      limit: activeOp.extra === "strings" ? limit : undefined,
      offset: activeOp.extra === "strings" ? offset : undefined,
      pathOrder: activeOp.extra === "strings" ? pathOrder : undefined,
      characterOrder: activeOp.extra === "strings" ? characterOrder : undefined,
    });
  }, [
    operation,
    regex1,
    regex2,
    activeOp,
    min,
    max,
    limit,
    offset,
    pathOrder,
    characterOrder,
  ]);

  const examplePayload = useMemo(() => {
    const payload: SnippetExample = {};
    if (activeOp.args === 2) {
      payload.terms = [
        { type: "regex", value: regex1 },
        { type: "regex", value: regex2 },
      ];
    } else {
      payload.term = { type: "regex", value: regex1 };
    }

    if (activeOp.extra === "repeat") {
      payload.min = min;
      payload.max = max === "" ? null : max;
    }

    if (activeOp.extra === "strings") {
      payload.limit = limit;
      payload.offset = offset;
      payload.pathOrder = pathOrder;
      payload.characterOrder = characterOrder;
    }

    return payload;
  }, [
    activeOp,
    regex1,
    regex2,
    min,
    max,
    limit,
    offset,
    pathOrder,
    characterOrder,
  ]);

  const selectOperation = (value: string) => {
    const op = OPS.find((o) => o.value === value);
    if (!op) return;
    // Keep whatever patterns and parameters the user has typed — only the
    // operation (and its stale result) changes.
    setOperation(value);
    setResult(null);
    setError(null);
    if (analyticsEnabled)
      posthog.capture("demo_operation_changed", {
        operation: value,
        group: op.group,
      });
  };

  /* A known answer, played back as a compute: COMPUTING… for about as long as
     the round trip it stands in for, then the result renders itself again —
     the typewriter and the strings reveal both restart, because clearing
     `result` first makes them remount. Indistinguishable from a real run from
     the outside, except that the network stays silent. */
  const replay = async (known: {
    data: { type: string; value: string | string[] } | null;
    error: string | null;
  }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    await new Promise((r) => setTimeout(r, 180 + Math.random() * 220));
    setIsLoading(false);
    if (known.error !== null) setError(known.error);
    else setResult(known.data);
  };

  const onCompute = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading) return;

    const known = answers.get(currentParams);
    if (known) {
      await replay(known);
      if (analyticsEnabled)
        posthog.capture("demo_operation_run", {
          operation,
          group: activeOp.group,
          result_type: known.data?.type,
          // Engagement still counts; it just was not recomputed.
          cached: true,
        });
      return;
    }

    try {
      new RegExp(regex1);
      if (activeOp.args === 2) {
        new RegExp(regex2);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Regex Syntax Error: ${message}`);
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = (await compute(currentParams)) as {
        type: string;
        value: string | string[];
      };
      answers.set(currentParams, { data, error: null });
      setResult(data);
      if (analyticsEnabled)
        posthog.capture("demo_operation_run", {
          operation,
          group: activeOp.group,
          result_type: data?.type,
          cached: false,
          ...(activeOp.extra === "strings"
            ? {
                path_order: pathOrder,
                character_order: characterOrder,
                limit,
                offset,
              }
            : {}),
        });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Failed to compute operation";
      // The engine answered (an error stands for these inputs); an engine that
      // failed to load records nothing, so a retry still goes through.
      if (!(err instanceof EngineUnavailableError))
        answers.set(currentParams, { data: null, error: message });
      setError(message);
      if (analyticsEnabled)
        posthog.capture("demo_operation_failed", {
          operation,
          group: activeOp.group,
          error_message: message,
        });
    } finally {
      setIsLoading(false);
    }
  };

  const resultLabel = result
    ? result.type === "regex" || result.type === "fair"
      ? "PATTERN"
      : result.type === "dot"
        ? "AUTOMATON"
        : result.type.toUpperCase()
    : "RESULT";

  // COPY writes one raw string per line for array results.
  const resultText = result
    ? Array.isArray(result.value)
      ? result.value.join("\n")
      : String(result.value)
    : "";

  // Scalar results type out character by character — the same animation as
  // the hero's worked examples on the landing page. Array results render
  // through StringsReadout, DOT source through DotGraph, instead.
  const { out, typing, type, reset } = useTypewriter();
  useEffect(() => {
    if (result && result.type !== "dot" && !Array.isArray(result.value)) {
      type(resultText, 100);
    } else {
      reset();
    }
  }, [result, resultText, type, reset]);

  return (
    <div className="w-full flex flex-col items-center bg-background text-foreground selection:bg-set-a/20 min-h-screen font-sans antialiased">
      <Header />

      {/* --- PAGE HEADER --- */}
      <section className="w-full">
        <div className="max-w-270 mx-auto px-5 md:px-16 pt-12 md:pt-16 pb-10">
          <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">Live demo.</h1>
          <p className="mt-4 max-w-(--measure) text-muted-foreground leading-relaxed">
            The real API, no token needed. Pick an operation, edit the
            patterns and compute.
          </p>
        </div>
      </section>

      {/* --- INSTRUMENT --- */}
      <section className="w-full">
        <div className="max-w-270 mx-auto px-5 md:px-16 pb-16 md:pb-24 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-12 items-start">
          <div className="space-y-10 min-w-0">
            <form
              onSubmit={onCompute}
              className="border border-rule rounded-(--radius)"
            >
              <div className="p-4 md:p-5 space-y-5">
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                  <label htmlFor="operation" className={capLabel}>
                    OPERATION
                  </label>
                  <div className="relative">
                    <select
                      id="operation"
                      value={operation}
                      onChange={(e) => selectOperation(e.target.value)}
                      className={`${inputBase} w-full appearance-none cursor-pointer pr-9`}
                    >
                      {(["Analyze", "Compute", "Generate"] as const).map(
                        (group) => (
                          <optgroup key={group} label={group}>
                            {OPS.filter((o) => o.group === group).map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </optgroup>
                        ),
                      )}
                    </select>
                    {selectChevron}
                  </div>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    {activeOp.hint}
                  </p>
                </div>

                <div
                  className={`grid gap-4 ${activeOp.args === 2 ? "md:grid-cols-[1fr_auto_1fr]" : "md:grid-cols-1"}`}
                >
                  <div className="flex flex-col gap-2 min-w-0">
                    <label
                      htmlFor="regex1"
                      className={`${capLabel} text-set-a!`}
                    >
                      {activeOp.input1Label.toUpperCase()}
                    </label>
                    <input
                      id="regex1"
                      value={regex1}
                      onChange={(e) => {
                        setRegex1(e.target.value);
                        setResult(null);
                        setError(null);
                      }}
                      spellCheck={false}
                      className={`${inputBase} text-set-a`}
                      placeholder="e.g. /api/v[12]/.*"
                    />
                  </div>

                  {activeOp.args === 2 && (
                    <div className="flex items-center justify-center self-end h-11">
                      <button
                        type="button"
                        onClick={() => {
                          const temp = regex1;
                          setRegex1(regex2);
                          setRegex2(temp);
                          setResult(null);
                        }}
                        className="p-2 rounded-(--radius) hover:bg-accent text-muted-foreground transition-colors"
                        title="Swap patterns"
                        aria-label="Swap patterns"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {activeOp.args === 2 && (
                    <div className="flex flex-col gap-2 min-w-0">
                      <label
                        htmlFor="regex2"
                        className={`${capLabel} text-set-b!`}
                      >
                        {activeOp.input2Label!.toUpperCase()}
                      </label>
                      <input
                        id="regex2"
                        value={regex2}
                        onChange={(e) => {
                          setRegex2(e.target.value);
                          setResult(null);
                          setError(null);
                        }}
                        spellCheck={false}
                        className={`${inputBase} text-set-b`}
                        placeholder="e.g. .*/users/[0-9]+"
                      />
                    </div>
                  )}
                </div>

                {activeOp.extra === "repeat" && (
                  <div className="grid gap-4 md:grid-cols-2 md:w-1/2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="min" className={capLabel}>
                        MIN REPETITIONS
                      </label>
                      <input
                        id="min"
                        type="number"
                        min="0"
                        max="100"
                        value={min}
                        onChange={(e) => {
                          setMin(parseInt(e.target.value) || 0);
                          setResult(null);
                        }}
                        className={inputBase}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="max" className={capLabel}>
                        MAX (OPTIONAL)
                      </label>
                      <input
                        id="max"
                        type="number"
                        min="0"
                        max="100"
                        value={max}
                        onChange={(e) => {
                          setMax(
                            e.target.value ? parseInt(e.target.value) : "",
                          );
                          setResult(null);
                        }}
                        className={inputBase}
                        placeholder="Unbounded"
                      />
                    </div>
                  </div>
                )}
                {activeOp.extra === "strings" && (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="pathOrder" className={capLabel}>
                        PATH ORDER
                      </label>
                      <div className="relative">
                        <select
                          id="pathOrder"
                          value={pathOrder}
                          onChange={(e) => {
                            setPathOrder(e.target.value as PathOrder);
                            setResult(null);
                          }}
                          className={`${inputBase} w-full appearance-none cursor-pointer pr-9`}
                          title="sweep: one shape at a time, shortest first · interleave: every shape before any repeats · shuffled: interleave in seeded order"
                        >
                          {PATH_ORDERS.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                        {selectChevron}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="characterOrder" className={capLabel}>
                        CHARACTER ORDER
                      </label>
                      <div className="relative">
                        <select
                          id="characterOrder"
                          value={characterOrder}
                          onChange={(e) => {
                            setCharacterOrder(e.target.value as CharacterOrder);
                            setResult(null);
                          }}
                          className={`${inputBase} w-full appearance-none cursor-pointer pr-9`}
                          title="ascending: smallest characters first · shuffled: seeded permutation, realistic-looking strings"
                        >
                          {CHARACTER_ORDERS.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                        {selectChevron}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="limit" className={capLabel}>
                        LIMIT
                      </label>
                      <input
                        id="limit"
                        type="number"
                        min="1"
                        max="10"
                        value={limit}
                        onChange={(e) => {
                          setLimit(parseInt(e.target.value) || 10);
                          setResult(null);
                        }}
                        className={inputBase}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="offset" className={capLabel}>
                        OFFSET
                      </label>
                      <input
                        id="offset"
                        type="number"
                        min="0"
                        max="10"
                        value={offset}
                        onChange={(e) => {
                          setOffset(parseInt(e.target.value) || 0);
                          setResult(null);
                        }}
                        className={inputBase}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="font-mono text-[0.6875rem] font-medium tracking-[0.08em] px-4 py-2.5 cursor-pointer rounded-(--radius) border border-overlap bg-overlap text-paper hover:opacity-90 transition-opacity disabled:bg-transparent disabled:text-mute disabled:border-rule disabled:cursor-default"
                  >
                    {isLoading ? "COMPUTING…" : "COMPUTE"}
                  </button>
                  {result &&
                    (result.type === "regex" || result.type === "fair") && (
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setRegex1(resultText);
                            setResult(null);
                            if (analyticsEnabled)
                              posthog.capture("demo_result_used_as_input", {
                                operation,
                                input_index: 1,
                              });
                          }}
                          className={`${capLabel} hover:text-foreground transition-colors cursor-pointer`}
                        >
                          USE AS {activeOp.input1Label.toUpperCase()}
                        </button>
                        {activeOp.args === 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setRegex2(resultText);
                              setResult(null);
                              if (analyticsEnabled)
                                posthog.capture("demo_result_used_as_input", {
                                  operation,
                                  input_index: 2,
                                });
                            }}
                            className={`${capLabel} hover:text-foreground transition-colors cursor-pointer`}
                          >
                            USE AS {activeOp.input2Label!.toUpperCase()}
                          </button>
                        )}
                      </div>
                    )}
                  {result && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resultText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        if (analyticsEnabled)
                          posthog.capture("demo_result_copied", {
                            operation,
                            result_type: result.type,
                          });
                      }}
                      className={`${capLabel} hover:text-foreground transition-colors cursor-pointer`}
                      title="Copy to clipboard"
                    >
                      {copied ? "COPIED" : "COPY"}
                    </button>
                  )}
                </div>
              </div>

              {/* Readout — computed results are set in the overlap colour.
                  aria-live announces the answer (or error) once it lands; the
                  typewriter/reveal animations are aria-hidden with the full
                  text in an sr-only twin, so screen readers hear one complete
                  result instead of every animation frame. */}
              <div
                aria-live="polite"
                className={`flex items-baseline gap-3 flex-wrap px-4 py-3 border-t border-rule font-mono text-[0.8125rem] ${
                  error ? "bg-(--set-b-05)" : "bg-(--overlap-08)"
                }`}
              >
                {error ? (
                  <>
                    <span className={`${capLabel} text-set-b!`}>ERROR</span>
                    <span className="text-set-b break-all whitespace-pre-wrap">
                      {error.replace(/^(error=)/, "")}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={capLabel}>{resultLabel}</span>
                    {isLoading ? (
                      <span className="text-muted-foreground">computing…</span>
                    ) : result ? (
                      Array.isArray(result.value) ? (
                        <StringsReadout values={result.value} />
                      ) : result.type === "dot" ? (
                        // Renders as two flex items: the size toggle stays on
                        // this row, the graph wraps onto the next one.
                        <DotGraph dot={resultText} />
                      ) : (
                        <>
                          <span className="sr-only">{resultText}</span>
                          <span
                            aria-hidden
                            className="is-computed font-medium break-all"
                          >
                            {out}
                            {typing && (
                              <span className="inline-block w-[0.5em] bg-overlap animate-pulse align-baseline">
                                &nbsp;
                              </span>
                            )}
                          </span>
                        </>
                      )
                    ) : (
                      <span
                        className="inline-block w-[0.5em] self-stretch bg-overlap animate-pulse"
                        aria-hidden
                      >
                        &nbsp;
                      </span>
                    )}
                  </>
                )}
              </div>
            </form>

            <div className="space-y-3">
              <h2 className={capLabel}>THE SAME CALL WITH THE SDK</h2>
              <CustomCodeTabs
                tabs={[
                  {
                    label: "JavaScript",
                    value: "javascript",
                    language: "javascript",
                    code: generateFullSnippet(
                      "js",
                      { operationId: operation },
                      examplePayload,
                    ),
                  },
                  {
                    label: "Java",
                    value: "java",
                    language: "java",
                    code: generateFullSnippet(
                      "java",
                      { operationId: operation },
                      examplePayload,
                    ),
                  },
                  {
                    label: "Python",
                    value: "python",
                    language: "python",
                    code: generateFullSnippet(
                      "python",
                      { operationId: operation },
                      examplePayload,
                    ),
                  },
                ]}
              />
            </div>
          </div>

          <aside className="border-l-2 border-rule pl-5 space-y-3 lg:sticky lg:top-20">
            <h2 className="display text-(length:--t-h3) font-semibold">
              Your own token
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This demo runs on a shared quota. An API token from the console
              gives you the Free plan limits: 10,000 requests per month.
            </p>
            <p className="font-mono text-[0.8125rem] space-x-0 flex flex-col gap-2">
              <Link
                to={process.env.NEXT_PUBLIC_CONSOLE_URL || "#"}
                target="_blank"
                className="text-set-a hover:underline underline-offset-4"
              >
                Get an API token →
              </Link>
              <Link
                to={docs("/quickstart")}
                className="text-set-a hover:underline underline-offset-4"
              >
                Quickstart →
              </Link>
            </p>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
};
