"use client";

import { useEffect, useRef, useState } from "react";
import {
  NAV_ITEMS,
  isExternalSiteLink,
  isSiteNavGroup,
  resolveSiteLink,
  type SiteNavGroup,
} from "@regexsolver/web-shared/site-links";
import { Link } from "./ui/Link";
import { Button } from "./ui/Button";
import { useTheme } from "./ui/ThemeContext";
import { Sun, Moon, X, Menu, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";

/* Link content lives in web-shared (site-links.ts) so the docs header
   (zudoku.config.tsx header.navigation) can never drift from this one. */
const ORIGINS = {
  website: "",
  docs: process.env.NEXT_PUBLIC_DOCS_URL || "",
  console: process.env.NEXT_PUBLIC_CONSOLE_URL || "#",
};

/* Same pill switch as the docs header (Zudoku's ThemeSwitch). On mobile it
   lives at the bottom of the nav overlay, like the docs drawer's switch. */
const ThemePill = ({ className = "" }: { className?: string }) => {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      className={`rounded-full border border-border p-0.5 gap-0.5 group cursor-pointer ${className}`}
    >
      <span
        className={`rounded-full p-0.5 border transition-colors ${
          theme === "dark" ? "border-transparent" : "border-border bg-muted"
        }`}
      >
        <Sun className="w-4 h-4" />
      </span>
      <span
        className={`rounded-full p-0.5 border transition-colors ${
          theme === "dark" ? "border-border bg-muted" : "border-transparent"
        }`}
      >
        <Moon className="w-4 h-4" />
      </span>
    </button>
  );
};

/* The dropdown for a nav group. Deliberately mirrors what Zudoku renders on the
   docs for the same `SiteNavGroup` (its HeaderNavigation.tsx + NavigationMenu.tsx):
   a quiet trigger with a chevron that rotates when open, and a 400px panel of
   label + description items, two per row. Zudoku uses Radix NavigationMenu;
   there is no Radix in this app, so the behaviour is reproduced here — opens on
   hover and on click, closes on Escape, outside click, or pointer leave.

   The panel is positioned against the <nav>, not the trigger, because Zudoku
   centres its viewport under the whole nav when placements.navigation is
   "center". It stays a DOM child of this wrapper so pointer-leave still works. */
const NavDropdown = ({
  group,
  origins,
}: {
  group: SiteNavGroup;
  origins: { website: string; docs: string; console: string };
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen]);

  return (
    // h-9 + items-center: the wrapper must fill the nav's height so its hover
    // area touches the panel below (`top-full` on the nav). Sized to the 20px
    // trigger instead, there is an 8px dead strip between trigger and panel;
    // crossing it fires mouseleave and closes the menu before it can be used.
    <div
      className="flex h-9 items-center"
      ref={wrapperRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          setIsOpen(false);
          wrapperRef.current?.querySelector("button")?.focus();
        }
      }}
    >
      {/* Open-only on purpose, not a toggle: hovering onto the trigger has
          already opened the panel, so a toggle would make that first click
          close it — a dead menu right when the user commits. (Radix avoids
          this with an open delay; hover/click-both-open is the simple
          equivalent.) Closing is leave, Escape, or outside click. */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
      >
        {group.label}
        <ChevronDown
          aria-hidden
          className={`relative top-px size-3 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 p-2 pr-2.5 rounded-[2px] border border-rule bg-popover text-popover-foreground shadow">
          <ul className="grid grid-cols-2 gap-1 p-3 w-100">
            {group.items.map((item) => (
              <li key={item.label}>
                <Link
                  to={resolveSiteLink(item, origins)}
                  {...(isExternalSiteLink(item) ? { target: "_blank" } : {})}
                  onClick={() => setIsOpen(false)}
                  className="block select-none p-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <span className="block text-sm font-medium leading-none text-foreground">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="block text-sm leading-snug text-muted-foreground mt-2.5 line-clamp-2">
                      {item.description}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        /* Code samples are printed in the same two inks as everything else. */
        :root, .dark {
          --prism-text: var(--ink);
          --prism-comment: var(--mute);
          --prism-property: color-mix(in srgb, var(--set-a) 60%, var(--ink));
          --prism-string: var(--set-a);
          --prism-keyword: var(--set-b);
          --prism-function: color-mix(in srgb, var(--set-a) 60%, var(--ink));
          --prism-regex: var(--set-a);
        }

        code[class*="language-"],
        pre[class*="language-"] {
          color: var(--prism-text);
          background: none;
          font-family: var(--font-code);
          text-align: left;
          /* Code keeps its own line breaks and scrolls sideways — breaking a
             long line mid-token makes a snippet impossible to read or copy.
             The scroll container is the <pre> (see CodeBlock). */
          white-space: pre;
          word-spacing: normal;
          word-break: normal;
          word-wrap: normal;
          line-height: 1.6;
          tab-size: 4;
          hyphens: none;
        }

        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: var(--prism-comment);
          font-style: italic;
        }

        .token.namespace {
          opacity: .7;
        }

        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
          color: var(--prism-property);
        }

        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
          color: var(--prism-string);
        }

        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: var(--prism-property);
        }

        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: var(--prism-keyword);
        }

        .token.function,
        .token.class-name {
          color: var(--prism-function);
        }

        .token.regex,
        .token.important,
        .token.variable {
          color: var(--prism-regex);
        }

        .token.important,
        .token.bold {
          font-weight: bold;
        }
        .token.italic {
          font-style: italic;
        }

        .token.entity {
          cursor: help;
        }
      `}</style>
      {/* Hairline as an inset shadow (not border-b) so content centres in the
          full 56px, exactly like the docs header. */}
      <header className="w-full h-14 shadow-[inset_0_-1px_0_0_var(--rule)] bg-background/80 backdrop-blur sticky top-0 z-[100]">
        <div className="relative max-w-screen-2xl mx-auto h-full flex items-center justify-between px-4 lg:px-8">
          {/* Left: wordmark — 24px tall, kept identical to the docs header
              logo (zudoku.config.tsx site.logo width 192px ≈ 24px tall) */}
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo className="h-6 w-auto" />
          </Link>

          {/* Center: navigation. From lg it is pinned to the exact centre of
              the bar so it lines up pixel-for-pixel with the docs header's
              .site-nav (zudoku.config.tsx customCss); at md the flex flow
              centres it approximately between logo and controls. */}
          <nav className="hidden md:flex relative h-9 items-center gap-7 text-sm text-muted-foreground lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
            {NAV_ITEMS.map((item) =>
              isSiteNavGroup(item) ? (
                <NavDropdown key={item.label} group={item} origins={ORIGINS} />
              ) : (
                <Link
                  key={item.label}
                  to={resolveSiteLink(item, ORIGINS)}
                  {...(isExternalSiteLink(item) ? { target: "_blank" } : {})}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          {/* Right: console & theme toggle */}
          <div className="flex items-center gap-2">
            <Link
              to={ORIGINS.console}
              target="_blank"
              className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-set-a hover:opacity-80 transition-opacity px-2 py-1"
            >
              Console <span aria-hidden>↗</span>
            </Link>
            {/* Hidden on mobile — the switch moves into the nav overlay,
                matching the docs drawer (bar shows only logo + burger). */}
            <ThemePill className="hidden md:flex" />

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 top-14 bg-background z-[150] md:hidden flex flex-col p-6 space-y-8 overflow-y-auto h-[calc(100dvh-56px)]">
          <div className="space-y-6">
            {NAV_ITEMS.map((item) =>
              isSiteNavGroup(item) ? (
                <div key={item.label} className="space-y-4">
                  <span className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground">
                    {item.label.toUpperCase()}
                  </span>
                  <div className="space-y-4 pl-3 border-l border-rule">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.label}
                        to={resolveSiteLink(subItem, ORIGINS)}
                        {...(isExternalSiteLink(subItem)
                          ? { target: "_blank" }
                          : {})}
                        className="display text-xl hover:text-set-a transition-colors block"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={resolveSiteLink(item, ORIGINS)}
                  {...(isExternalSiteLink(item) ? { target: "_blank" } : {})}
                  className="display text-xl hover:text-set-a transition-colors block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>

          <div className="pt-6">
            <Button size="lg" className="w-full text-base h-12" asChild>
              <Link
                to={ORIGINS.console}
                target="_blank"
                onClick={() => setIsMenuOpen(false)}
              >
                Developer Console ↗
              </Link>
            </Button>
          </div>

          {/* Bottom bar with the theme switch, like the docs drawer's. */}
          <div className="mt-auto! border-t border-rule pt-4 pb-2 flex justify-start">
            <ThemePill className="flex" />
          </div>
        </div>
      )}
    </>
  );
};
