"use client";

import * as React from "react";
import { getSharedTheme, setSharedTheme } from "../../lib/theme";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined,
);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = React.useState<Theme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // A choice made on any subdomain (cross-subdomain cookie) wins over this
    // site's own saved preference; "system" resolves via prefers-color-scheme.
    const shared = getSharedTheme();
    const saved =
      shared === "system"
        ? null
        : (shared ?? (localStorage.getItem("theme") as Theme | null));
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Only explicit user changes propagate to the shared cookie — the load-time
  // resolution above must not overwrite e.g. a "system" choice made elsewhere.
  const changeTheme = React.useCallback((next: Theme) => {
    setTheme(next);
    setSharedTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
