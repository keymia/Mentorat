"use client";

import { useSyncExternalStore } from "react";

import { LANGUAGE_STORAGE_KEY, type Language } from "@/lib/i18n";

function readCurrentLanguage(): Language {
  if (typeof window === "undefined") {
    return "fr";
  }

  const documentLanguage = document.documentElement.dataset.language || document.documentElement.lang;
  if (documentLanguage === "en") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedLanguage === "en" ? "en" : "fr";
}

function subscribeToHelpLanguage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang", "data-language"],
  });

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("bmc-language-change", onStoreChange);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("bmc-language-change", onStoreChange);
  };
}

export function useHelpLanguage() {
  return useSyncExternalStore<Language>(subscribeToHelpLanguage, readCurrentLanguage, () => "fr");
}
