"use client";

import { useEffect, useState } from "react";

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

export function useHelpLanguage() {
  const [language, setLanguage] = useState<Language>(() => readCurrentLanguage());

  useEffect(() => {
    const updateLanguage = () => {
      setLanguage(readCurrentLanguage());
    };

    updateLanguage();

    const observer = new MutationObserver(updateLanguage);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang", "data-language"],
    });

    window.addEventListener("storage", updateLanguage);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", updateLanguage);
    };
  }, []);

  return language;
}
