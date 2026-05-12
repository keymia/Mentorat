"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LANGUAGE_STORAGE_KEY, Language, translateDocument } from "@/lib/i18n";

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "fr";
  }
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedLanguage === "en" ? "en" : "fr";
}

export function FloatingSiteControls() {
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage());
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    translateDocument(language);

    const observer = new MutationObserver(() => {
      translateDocument(language);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function toggleLanguage() {
    setLanguage((currentLanguage) => (currentLanguage === "fr" ? "en" : "fr"));
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isEnglish = language === "en";

  return (
    <>
      <div data-no-translate className="fixed bottom-5 left-5 z-50">
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={isEnglish ? "Switch language" : "Basculer la langue"}
          title={isEnglish ? "Switch language" : "Basculer la langue"}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/95 p-1 text-sm font-semibold shadow-card backdrop-blur"
        >
          <span className={`rounded-full px-3 py-1.5 transition ${!isEnglish ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            FR
          </span>
          <span className="text-muted-foreground">|</span>
          <span className={`rounded-full px-3 py-1.5 transition ${isEnglish ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            EN
          </span>
        </button>
      </div>

      {showScrollTop ? (
        <div data-no-translate className="fixed bottom-5 right-5 z-50">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="rounded-full shadow-card"
            onClick={scrollToTop}
            aria-label={isEnglish ? "Back to top" : "Retour en haut"}
            title={isEnglish ? "Back to top" : "Retour en haut"}
          >
            <ArrowUp aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </>
  );
}
