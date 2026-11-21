"use client";

import { NAV_ITEMS, isExternalSiteLink } from "@regexsolver/web-shared/site-links";
import { Link } from "./ui/Link";
import { useTheme } from "./ui/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { Logo } from "./Logo";

/* The site bar: the wordmark, three links and the theme switch. Short enough
   to need no menu on a phone. */
export const Header = () => {
  const { theme, setTheme } = useTheme();
  return (
    <header className="w-full">
      <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="hover:opacity-80 transition-opacity shrink-0">
          <Logo className="h-5 w-auto" />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6 text-sm text-muted-foreground whitespace-nowrap">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              {...(isExternalSiteLink(item) ? { target: "_blank" } : {})}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="p-1 hover:text-foreground transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
