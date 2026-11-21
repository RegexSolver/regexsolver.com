"use client";

import { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { useCodeLanguage } from "../lib/codeLanguage";

interface Tab {
  label: string;
  value: string;
  language: string;
  code: string;
}

interface CustomCodeTabsProps {
  tabs: Tab[];
  /** Drop the outer border and radius: for embedding inside a bordered
      figure, where the tab strip's own rule does the separating. */
  flush?: boolean;
  onTabChange?: (value: string) => void;
}

export const CustomCodeTabs = ({
  tabs,
  flush = false,
  onTabChange,
}: CustomCodeTabsProps) => {
  // Shared by every code block on the site: picking a language here switches
  // them all (see lib/codeLanguage.ts). A block without that language stays on
  // its first tab.
  const [language, setLanguage] = useCodeLanguage();
  const [copied, setCopied] = useState(false);

  const activeTabData = tabs.find((t) => t.language === language) || tabs[0];

  const handleCopy = () => {
    if (!activeTabData) return;
    navigator.clipboard.writeText(activeTabData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={
        flush
          ? "overflow-hidden"
          : "border border-rule rounded-[var(--radius)] overflow-hidden"
      }
    >
      <div
        className="flex items-center border-b border-rule"
        role="tablist"
        aria-label="Language"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTabData === tab}
            onClick={() => {
              setLanguage(tab.language);
              onTabChange?.(tab.value);
            }}
            className={`px-4 py-2.5 font-mono text-[0.8125rem] border-r border-rule transition-colors cursor-pointer ${
              activeTabData === tab
                ? "text-set-a bg-[var(--set-a-05)] font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={handleCopy}
          className="ml-auto px-4 py-2.5 font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Copy to clipboard"
        >
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>

      <div className="overflow-auto">
        <div className="p-2 md:p-3">
          <CodeBlock
            language={activeTabData.language}
            code={activeTabData.code}
          />
        </div>
      </div>
    </div>
  );
};
