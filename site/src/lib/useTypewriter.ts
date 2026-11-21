"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* The typing effect used for computed results (hero worked examples and the
   live demo readout): text appears character by character in the overlap
   colour. Respects prefers-reduced-motion by printing instantly. */
export const useTypewriter = () => {
  const [out, setOut] = useState("");
  const [typing, setTyping] = useState(false);
  const reduceRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    reduceRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    return clearTimers;
  }, [clearTimers]);

  const type = useCallback(
    (text: string, initialDelay = 350) => {
      clearTimers();
      if (reduceRef.current) {
        setOut(text);
        setTyping(false);
        return;
      }
      setOut("");
      setTyping(true);
      let i = 0;
      const step = () => {
        i += 1;
        setOut(text.slice(0, i));
        if (i < text.length) {
          timersRef.current.push(window.setTimeout(step, 22));
        } else {
          setTyping(false);
        }
      };
      timersRef.current.push(window.setTimeout(step, initialDelay));
    },
    [clearTimers],
  );

  const reset = useCallback(() => {
    clearTimers();
    setOut("");
    setTyping(false);
  }, [clearTimers]);

  return { out, typing, type, reset };
};
