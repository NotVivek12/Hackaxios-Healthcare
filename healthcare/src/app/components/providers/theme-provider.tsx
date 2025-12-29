"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function safeMatchMedia(query: string) {
  if (typeof window === "undefined" || !window.matchMedia) return undefined;
  return window.matchMedia(query);
}

function resolveTheme(theme: Theme) {
  if (theme !== "system") return theme;
  const prefersDark = safeMatchMedia("(prefers-color-scheme: dark)");
  return prefersDark?.matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return "light";
  const root = document.documentElement;
  const effective = resolveTheme(theme);
  if (effective === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.dataset.theme = effective;
  root.style.colorScheme = effective;
  return effective;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setThemeState(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const effective = applyTheme(theme);
    setResolvedTheme(effective);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const media = safeMatchMedia("(prefers-color-scheme: dark)");
    if (!media) return;
    const handleChange = () => {
      if (theme === "system") {
        const effective = applyTheme("system");
        setResolvedTheme(effective);
      }
    };
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
  };

  const value = useMemo(() => ({ theme, setTheme, resolvedTheme }), [theme, resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
