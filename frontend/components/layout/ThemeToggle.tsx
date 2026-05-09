"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEME_STORAGE_KEY = "bmc-theme";
const THEME_CHANGE_EVENT = "bmc-theme-change";
type ThemeMode = "light" | "dark";

const themeTokens: Record<ThemeMode, Record<string, string>> = {
  light: {
    "--background": "#fffaf2",
    "--foreground": "#171513",
    "--card": "#fffdf8",
    "--card-foreground": "#171513",
    "--primary": "#9f1416",
    "--primary-foreground": "#fff8ed",
    "--secondary": "#f3e6d2",
    "--secondary-foreground": "#171513",
    "--muted": "#f7eee3",
    "--muted-foreground": "#695f55",
    "--accent": "#c89555",
    "--accent-foreground": "#1d1712",
    "--border": "rgb(23 21 19 / 0.13)",
    "--input": "rgb(23 21 19 / 0.17)",
    "--ring": "#c89555",
  },
  dark: {
    "--background": "#0f0d0c",
    "--foreground": "#f8efe4",
    "--card": "#181513",
    "--card-foreground": "#f8efe4",
    "--primary": "#d6403f",
    "--primary-foreground": "#fff8ed",
    "--secondary": "#251f1b",
    "--secondary-foreground": "#f8efe4",
    "--muted": "#211c18",
    "--muted-foreground": "#c7b7a5",
    "--accent": "#d3a262",
    "--accent-foreground": "#171513",
    "--border": "rgb(255 248 237 / 0.13)",
    "--input": "rgb(255 248 237 / 0.16)",
    "--ring": "#d3a262",
  },
};

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribeToThemeChanges(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function applyTheme(theme: ThemeMode) {
  Object.entries(themeTokens[theme]).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribeToThemeChanges, getThemeSnapshot, () => "light");
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(className)}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      onClick={() => applyTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
