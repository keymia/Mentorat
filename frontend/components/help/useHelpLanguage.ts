"use client";

import { useSyncExternalStore } from "react";

import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  LEGACY_LANGUAGE_CHANGE_EVENT,
  LEGACY_LANGUAGE_STORAGE_KEY,
  type Language,
} from "@/lib/i18n";

function readCurrentLanguage(): Language {
  if (typeof window === "undefined") {
    return "fr";
  }

  const documentLanguage = document.documentElement.dataset.language || document.documentElement.lang;
  if (documentLanguage === "en") {
    return "en";
  }

  const storedLanguage =
    window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
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
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  window.addEventListener(LEGACY_LANGUAGE_CHANGE_EVENT, onStoreChange);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
    window.removeEventListener(LEGACY_LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
}

export function useHelpLanguage() {
  return useSyncExternalStore<Language>(subscribeToHelpLanguage, readCurrentLanguage, () => "fr");
}
