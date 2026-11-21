"use client";

import { useEffect, useRef, useState } from "react";

/* Graphviz runs in the browser (WASM, ~1.2 MB), so it is pulled in only once a
   graph is actually rendered — a cached dynamic import rather than a top-level
   one, which also keeps it out of the static export's initial bundle. */
type Viz = Awaited<ReturnType<typeof import("@viz-js/viz").instance>>;
let vizPromise: Promise<Viz> | null = null;
const getViz = () => {
  if (!vizPromise) vizPromise = import("@viz-js/viz").then((m) => m.instance());
  return vizPromise;
};

/* Graphviz writes literal black strokes/fills and Times labels; remapping them
   to currentColor and the code font makes the graph follow the theme and the
   computed-result colour instead of punching a black box into the page. */
const GRAPH_CSS = `
.dot-graph svg { display: block; margin: 0 auto; overflow: visible; }
.dot-graph[data-fit="true"] svg { max-width: 100%; height: auto; }
.dot-graph svg [stroke="black"] { stroke: currentColor; }
.dot-graph svg [fill="black"] { fill: currentColor; }
.dot-graph svg text { fill: currentColor; font-family: var(--font-code); }
`;

const capLabel =
  "font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground";

/** Renders Graphviz DOT source as an inline SVG automaton diagram. */
export const DotGraph = ({ dot }: { dot: string }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  // Fit-to-width keeps small automata readable; wide ones are easier to follow
  // at natural size, scrolled horizontally.
  const [fit, setFit] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    setError(null);

    getViz()
      .then((viz) => {
        if (cancelled) return;
        const svg = viz.renderSVGElement(dot, {
          graphAttributes: { bgcolor: "transparent" },
          nodeAttributes: { fontname: "monospace" },
          edgeAttributes: { fontname: "monospace" },
        });
        hostRef.current?.replaceChildren(svg);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        hostRef.current?.replaceChildren();
        setError(
          e instanceof Error ? e.message : "Could not lay out the graph",
        );
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [dot]);

  /* Two flex items, not one wrapper: the readout in LiveDemo is a wrapping flex
     row, so the status/toggle sits on the AUTOMATON label row while the graph
     (basis-full) wraps onto its own line underneath. */
  return (
    <>
      {status === "ready" ? (
        <button
          type="button"
          onClick={() => setFit((f) => !f)}
          className={`${capLabel} ml-auto hover:text-foreground transition-colors cursor-pointer`}
        >
          {fit ? "ACTUAL SIZE" : "FIT WIDTH"}
        </button>
      ) : (
        <span className={`${capLabel} ml-auto`}>
          {status === "loading" ? "LAYING OUT…" : "LAYOUT FAILED"}
        </span>
      )}

      <div className="basis-full min-w-0">
        <style>{GRAPH_CSS}</style>

        {error && <p className="text-set-b break-all pb-2">{error}</p>}

        <div
          ref={hostRef}
          data-fit={fit}
          className="dot-graph is-computed overflow-auto max-h-[28rem] rounded-(--radius) border border-rule bg-background p-4"
        />
      </div>
    </>
  );
};
