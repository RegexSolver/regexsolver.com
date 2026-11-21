import { useSyncExternalStore } from "react";

/* The SDK language picked in any CustomCodeTabs, shared by every code block on
   the page and remembered in localStorage so the next page opens on it too.
   Keyed on the tab's Prism `language` ("javascript" | "java" | "python"), which
   every caller agrees on, rather than its `value` (the demo says "javascript"
   where the other pages say "js").

   The server snapshot is null, so the static export prerenders each block on
   its first tab and hydration swaps in the stored choice without a mismatch. */

const KEY = "code-language";
const listeners = new Set<() => void>();
// Holds the choice when localStorage throws (blocked storage): it then still
// syncs the blocks on this page, it just is not remembered.
let memory: string | null = null;

const read = (): string | null => {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // The same choice made in another browser tab of the site.
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

const setCodeLanguage = (language: string) => {
  memory = language;
  try {
    localStorage.setItem(KEY, language);
  } catch {
    // See `memory`.
  }
  listeners.forEach((listener) => listener());
};

export const useCodeLanguage = () =>
  [
    useSyncExternalStore(subscribe, read, () => null),
    setCodeLanguage,
  ] as const;
