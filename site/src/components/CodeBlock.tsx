"use client";

import { useEffect, useRef } from "react";
import Prism from "prismjs";

import "prismjs/components/prism-java";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-regex";

interface CodeBlockProps {
  code: string;
  language: string;
}

export const CodeBlock = ({ code, language }: CodeBlockProps) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  // The pre is the scroll container: long lines scroll sideways instead of
  // wrapping mid-token, which is unreadable for code. w-full + min-w-0 stop it
  // from being sized by its own content inside flex/grid parents.
  return (
    <pre
      suppressHydrationWarning
      className="m-0! p-4! bg-transparent! font-mono! text-sm leading-relaxed w-full min-w-0 overflow-x-auto whitespace-pre!"
    >
      <code
        ref={codeRef}
        className={`language-${language === "js" ? "javascript" : language}`}
      >
        {code}
      </code>
    </pre>
  );
};
