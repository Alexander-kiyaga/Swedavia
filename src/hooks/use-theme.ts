import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "swedavia.theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      localStorage.setItem(KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
