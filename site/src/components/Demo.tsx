"use client";

import React, { useState, useMemo, useEffect } from "react";
import posthog, { analyticsEnabled } from "../lib/posthog";
import { useTypewriter } from "../lib/useTypewriter";
import {
  type SnippetExample,
  generateFullSnippet,
  rustTab,
} from "../lib/generateCode";
import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { CustomCodeTabs } from "./CustomCodeTabs";
import { DotGraph } from "./DotGraph";
import {
  EngineUnavailableError,
  type ModelProgress,
  cachedModels,
  compute,
  errorKind,
  onModelProgress,
  preloadEngine,
} from "../lib/engine";
import { MODELS, findModel, megabytes } from "../lib/models";
import { REGEXSOLVER_VERSION } from "../lib/engineVersion";
import { docsAt } from "../lib/docs";
import { Link } from "./ui/Link";

/* Each operation carries a one-line description and a worked example. The
   example only prefills the initial state and ?op= deep links without inputs:
   switching operations keeps whatever the user has typed. */
const PATH_ORDERS = ["sweep", "interleave", "shuffled"] as const;
const CHARACTER_ORDERS = ["ascending", "shuffled"] as const;
type PathOrder = (typeof PATH_ORDERS)[number];
type CharacterOrder = (typeof CHARACTER_ORDERS)[number];

/* How an operation that returns a term shows it: the graph of its minimal
   automaton, or a pattern by state elimination or by one of the neural
   synthesis models (lib/models.ts), downloaded on first use. */
const FORMATS = [
  "automaton",
  "state_elimination",
  ...MODELS.map((m) => m.name),
] as const;
const DEFAULT_FORMAT = "kleene2-5m-b16-t128";

const GROUPS = [
  "Compare",
  "Analyze",
  "Combine",
  "Build",
  "Generate",
  "Convert",
] as const;
type Group = (typeof GROUPS)[number];
// The groups whose operations return a term, shown in `format`.
const TERM_GROUPS: Group[] = ["Combine", "Build", "Convert"];

type Op = {
  value: string;
  label: string;
  /** The README's API groups. */
  group: Group;
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
    value: "convert",
    label: "Convert pattern",
    group: "Convert",
    args: 1,
    input1Label: "Pattern",
    example: { regex1: "(ab|ac)*a(b|c)" },
    hint: "Converts the pattern to its minimal automaton, then shows it as RESULT AS picks: the automaton, or a pattern built back from it.",
  },
  {
    value: "equivalent",
    label: "Equivalent",
    group: "Compare",
    args: 2,
    input1Label: "Pattern A",
    input2Label: "Pattern B",
    example: { regex1: "(abcd|abef)", regex2: "ab(cd|ef)" },
    hint: "Checks whether two patterns match the same strings, whatever their syntax.",
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
    group: "Compare",
    args: 2,
    input1Label: "Pattern A (subset)",
    input2Label: "Pattern B (superset)",
    example: { regex1: "de", regex2: "(abc|de)" },
    hint: "Checks whether B matches everything A matches.",
  },

  {
    value: "intersection",
    label: "Intersection",
    group: "Combine",
    args: 2,
    input1Label: "Pattern A",
    input2Label: "Pattern B",
    example: { regex1: "/api/v[12]/.*", regex2: ".*/users/[0-9]+" },
    hint: "The strings both patterns match, as one pattern.",
  },
  {
    value: "union",
    label: "Union",
    group: "Combine",
    args: 2,
    input1Label: "Pattern A",
    input2Label: "Pattern B",
    example: { regex1: "ab", regex2: "cd" },
    hint: "The strings either pattern matches, as one pattern.",
  },
  {
    value: "difference",
    label: "Difference",
    group: "Combine",
    args: 2,
    input1Label: "Pattern A (base)",
    input2Label: "Pattern B (to subtract)",
    example: { regex1: "(ab|cd)", regex2: "cd" },
    hint: "The strings A matches and B does not.",
  },
  {
    value: "symmetric_difference",
    label: "Symmetric difference",
    group: "Combine",
    args: 2,
    input1Label: "Pattern A",
    input2Label: "Pattern B",
    example: { regex1: "(abc|de)", regex2: "(de|fghi)" },
    hint: "The strings exactly one of the two patterns matches.",
  },
  {
    value: "complement",
    label: "Complement",
    group: "Combine",
    args: 1,
    input1Label: "Pattern",
    example: { regex1: ".*a.*" },
    hint: "Every string the pattern does not match.",
  },
  {
    value: "concat",
    label: "Concatenation",
    group: "Build",
    args: 2,
    input1Label: "Pattern A (first)",
    input2Label: "Pattern B (second)",
    example: { regex1: "/api/", regex2: "v[12]/users" },
    hint: "A followed by B, as one pattern.",
  },
  {
    value: "repeat",
    label: "Repeat",
    group: "Build",
    args: 1,
    extra: "repeat",
    input1Label: "Pattern",
    example: { regex1: "abc", min: 3, max: "" },
    hint: "The pattern repeated min to max times; leave max empty for unbounded.",
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
    hint: "Strings the pattern matches, spread over the cases it allows, reproducible and pageable. Path order picks which shapes come first; character order picks the characters that fill them.",
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

/* The live demo: an operation, its patterns, the result computed in the
   browser (lib/engine.ts), and the same call as a Rust program. An operation
   that returns a term shows it as its automaton or as a pattern (`format`); a
   model is downloaded on first use, with its progress in the readout. With
   `syncUrl` (the /demo/ page) the inputs are read from and written to the
   query string, so a demo can be shared by its address, and the engine loads
   on arrival. Without it (the home page) it loads when the visitor first
   reaches for the form. */
export const Demo = ({ syncUrl = false }: { syncUrl?: boolean }) => {
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
  const [format, setFormat] = useState<string>(DEFAULT_FORMAT);
  // The model download under way, if any, and the models already downloaded.
  const [download, setDownload] = useState<ModelProgress | null>(null);
  const [cached, setCached] = useState<Set<string>>(() => new Set());

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
  const returnsTerm = TERM_GROUPS.includes(activeOp.group);
  const model = returnsTerm ? findModel(format) : undefined;

  useEffect(() => {
    cachedModels(MODELS).then(setCached);
    return onModelProgress(setDownload);
  }, []);

  // With syncUrl, shareable URLs: /demo/?op=intersection&a=…&b=… — read on
  // mount (static export, so query params are only available client-side)…
  useEffect(() => {
    const params = new URLSearchParams(syncUrl ? window.location.search : "");
    // ?op=dot is the former "Automaton graph": Convert pattern, as an
    // automaton.
    const legacyDot = params.get("op") === "dot";
    const op = OPS.find(
      (o) => o.value === (legacyDot ? "convert" : params.get("op")),
    );
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
      setFormat(
        legacyDot ? "automaton" : enumParam("format", FORMATS, DEFAULT_FORMAT),
      );
    }
    setUrlLoaded(true);
    // The engine loads while the visitor reads the form.
    if (syncUrl) preloadEngine();
  }, [syncUrl]);

  // …and written back on every change, so the current inputs can be shared
  // by copying the address bar (replaceState: no history spam while typing).
  useEffect(() => {
    if (!syncUrl || !urlLoaded) return;
    const params = new URLSearchParams();
    params.set("op", operation);
    params.set("a", regex1);
    if (activeOp.args === 2) params.set("b", regex2);
    if (activeOp.extra === "repeat") {
      params.set("min", String(min));
      if (max !== "") params.set("max", String(max));
    }
    if (returnsTerm) params.set("format", format);
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
    syncUrl,
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
    returnsTerm,
    format,
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
      format: returnsTerm ? format : undefined,
    });
  }, [
    returnsTerm,
    format,
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

    if (returnsTerm) payload.format = format;

    return payload;
  }, [
    returnsTerm,
    format,
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

  /* A known answer, played back: the readout clears for a moment, then the
     result renders again, so the typewriter and the strings reveal restart
     (clearing `result` first makes them remount). */
  const replay = async (known: {
    data: { type: string; value: string | string[] } | null;
    error: string | null;
  }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    await new Promise((r) => setTimeout(r, 150));
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
          // Engagement still counts, though nothing was recomputed.
          cached: true,
          ...(returnsTerm ? { format } : {}),
        });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setDownload(null);

    try {
      const data = (await compute(currentParams, model)) as {
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
          ...(returnsTerm ? { format } : {}),
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
          error_message: errorKind(message),
        });
    } finally {
      setIsLoading(false);
      setDownload(null);
      if (model) cachedModels(MODELS).then(setCached);
    }
  };

  const resultLabel = result
    ? result.type === "regex"
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

  // Scalar results type out character by character. Array results render
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
    <div className="space-y-6 min-w-0">
      <form
        onSubmit={onCompute}
        onFocus={preloadEngine}
        onPointerEnter={preloadEngine}
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
                {GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {OPS.filter((o) => o.group === group).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
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

          {returnsTerm && (
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <label htmlFor="format" className={capLabel}>
                RESULT AS
              </label>
              <div className="relative">
                <select
                  id="format"
                  value={format}
                  onChange={(e) => {
                    setFormat(e.target.value);
                    setResult(null);
                    setError(null);
                  }}
                  className={`${inputBase} w-full appearance-none cursor-pointer pr-9`}
                >
                  <option value="automaton">Automaton</option>
                  <option value="state_elimination">
                    Pattern, by state elimination
                  </option>
                  <optgroup label="Pattern, by neural synthesis">
                    {MODELS.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ·{" "}
                        {cached.has(m.name) ? "downloaded" : megabytes(m.bytes)}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {selectChevron}
              </div>
              <p className="text-[0.8125rem] text-muted-foreground">
                {format === "automaton"
                  ? "The minimal automaton of the result, drawn as a graph."
                  : format === "state_elimination"
                    ? "Converts the automaton back to a pattern: correct, but can be long."
                    : `A learned model proposes a simpler pattern, checked against the automaton. ${
                        model && !cached.has(model.name)
                          ? `Downloads ${megabytes(model.bytes)} on first use.`
                          : "Downloaded."
                      }`}
              </p>
            </div>
          )}

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
                  max="100"
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
            {result?.type === "regex" && (
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
                {error}
              </span>
            </>
          ) : (
            <>
              <span className={capLabel}>{resultLabel}</span>
              {isLoading ? (
                <span className="text-muted-foreground flex items-center gap-3 flex-wrap">
                  {download && model && download.model === model.name ? (
                    <>
                      downloading {model.name}…{" "}
                      {megabytes(download.loaded)} /{" "}
                      {megabytes(download.total || model.bytes)}
                      <span
                        aria-hidden
                        className="inline-block w-32 h-1 bg-rule rounded-full overflow-hidden"
                      >
                        <span
                          className="block h-full bg-overlap"
                          style={{
                            width: `${Math.min(100, (100 * download.loaded) / (download.total || model.bytes))}%`,
                          }}
                        />
                      </span>
                    </>
                  ) : (
                    "computing…"
                  )}
                </span>
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

      {/* The version sits on the summary's row, outside <summary> so a click
          on it follows the link instead of toggling the code. */}
      <div className="relative">
        <details className="group">
          <summary
            className={`${capLabel} cursor-pointer list-none hover:text-foreground transition-colors`}
          >
            <span className="inline-block transition-transform group-open:rotate-90">
              ›
            </span>{" "}
            THE SAME CALL IN RUST
          </summary>
          <div className="mt-3">
            <CustomCodeTabs
              tabs={rustTab(
                generateFullSnippet({ operationId: operation }, examplePayload),
              )}
            />
          </div>
        </details>
        <Link
          to={docsAt(REGEXSOLVER_VERSION)}
          title="The regexsolver version this demo runs"
          className={`${capLabel} absolute top-0 right-0 hover:text-foreground transition-colors`}
        >
          REGEXSOLVER {REGEXSOLVER_VERSION}
        </Link>
      </div>
    </div>
  );
};
