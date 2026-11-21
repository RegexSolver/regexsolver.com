"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Horizontal-scroll wrapper for the operation tables. On narrow screens the
   table is wider than the viewport and a bare overflow-x-auto gives no cue
   that it scrolls: an edge fade marks whichever side still has content, and
   disappears once that end is reached. */
export const TableScroll = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  // Both true until measured, so the server render carries no fades.
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 0);
    // -1 absorbs fractional scroll widths at some zoom levels.
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className="overflow-x-auto">
        {children}
      </div>
      {!atStart && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-background to-transparent"
        />
      )}
      {!atEnd && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-background to-transparent"
        />
      )}
    </div>
  );
};
