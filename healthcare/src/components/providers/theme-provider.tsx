"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

type Theme = "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "dark";
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyTheme() {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  root.classList.add("dark");
  root.dataset.theme = "dark";
  root.style.colorScheme = "dark";
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyTheme();
  }, []);

  const value = useMemo(() => ({ theme: "dark" as Theme, resolvedTheme: "dark" as const }), []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
