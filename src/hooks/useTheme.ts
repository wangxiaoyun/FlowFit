import { useEffect, useState, useCallback } from "react";
import { useTimerStore } from "../store/timerStore";

type Theme = "light" | "dark";

/**
 * Theme management hook.
 * Applies/removes the `dark` class on <html> and syncs with
 * the store's theme setting (light | dark | system).
 */
export function useTheme() {
  const settings = useTimerStore((s) => s.settings);
  const [resolved, setResolved] = useState<Theme>("light");

  const applyTheme = useCallback((theme: Theme) => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setResolved(theme);
  }, []);

  useEffect(() => {
    if (settings.theme === "dark") {
      const id = window.setTimeout(() => applyTheme("dark"), 0);
      return () => window.clearTimeout(id);
    } else if (settings.theme === "light") {
      const id = window.setTimeout(() => applyTheme("light"), 0);
      return () => window.clearTimeout(id);
    } else {
      // "system" — listen to prefers-color-scheme
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent | MediaQueryList) => {
        window.setTimeout(() => applyTheme(e.matches ? "dark" : "light"), 0);
      };
      handler(mq);
      mq.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
      return () =>
        mq.removeEventListener("change", handler as (e: MediaQueryListEvent) => void);
    }
  }, [settings.theme, applyTheme]);

  // Toggle: always switch to the other explicit value
  const toggleTheme = useCallback(() => {
    useTimerStore.getState().updateSettings({
      theme: resolved === "dark" ? "light" : "dark",
    });
  }, [resolved]);

  return { theme: resolved, toggleTheme };
}
