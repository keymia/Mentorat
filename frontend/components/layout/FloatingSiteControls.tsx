"use client";

import { ArrowUp, Languages } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  LEGACY_LANGUAGE_CHANGE_EVENT,
  LEGACY_LANGUAGE_STORAGE_KEY,
  Language,
  translateDocument,
} from "@/lib/i18n";

const STABLE_DOM_TRANSLATION_DELAY_MS = 250;

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "fr";
  }
  const storedLanguage =
    window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  return storedLanguage === "en" ? "en" : "fr";
}

function subscribeToLanguageChange(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
  window.addEventListener(LEGACY_LANGUAGE_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
    window.removeEventListener(LEGACY_LANGUAGE_CHANGE_EVENT, handleChange);
  };
}

export function FloatingSiteControls() {
  const language = useSyncExternalStore<Language>(subscribeToLanguageChange, getInitialLanguage, () => "fr");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isInitialPagePassRef = useRef(true);

  useEffect(() => {
    let observer: MutationObserver | null = null;
    let timeoutId: number | null = null;
    let loadHandler: (() => void) | null = null;
    let idleCallbackId: number | null = null;
    let frameIdOne: number | null = null;
    let frameIdTwo: number | null = null;

    function runTranslation() {
      translateDocument(language);
    }

    function scheduleTranslation(delay = STABLE_DOM_TRANSLATION_DELAY_MS) {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        runTranslation();
      }, delay);
    }

    function startObservation() {
      observer = new MutationObserver(() => {
        scheduleTranslation();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    function scheduleAfterPageStabilizes(callback: () => void) {
      const runAfterFrames = () => {
        frameIdOne = window.requestAnimationFrame(() => {
          frameIdTwo = window.requestAnimationFrame(() => {
            callback();
          });
        });
      };

      const runWhenIdle = () => {
        if ("requestIdleCallback" in window) {
          idleCallbackId = window.requestIdleCallback(() => {
            runAfterFrames();
          }, { timeout: 800 });
          return;
        }

        runAfterFrames();
      };

      if (document.readyState === "complete") {
        runWhenIdle();
        return;
      }

      loadHandler = () => {
        runWhenIdle();
      };

      window.addEventListener("load", loadHandler, { once: true });
    }

    if (isInitialPagePassRef.current) {
      isInitialPagePassRef.current = false;
      scheduleAfterPageStabilizes(() => {
        runTranslation();
        if (language === "en") {
          startObservation();
        }
      });
    } else {
      runTranslation();
      if (language === "en") {
        startObservation();
      }
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (frameIdOne !== null) {
        window.cancelAnimationFrame(frameIdOne);
      }
      if (frameIdTwo !== null) {
        window.cancelAnimationFrame(frameIdTwo);
      }
      if (loadHandler) {
        window.removeEventListener("load", loadHandler);
      }
      observer?.disconnect();
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
    const nextLanguage = language === "fr" ? "en" : "fr";
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isEnglish = language === "en";

  return (
    <>
      <div
        data-no-translate
        className="fixed left-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 sm:left-5 sm:bottom-5"
      >
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={isEnglish ? "Switch language" : "Basculer la langue"}
          title={isEnglish ? "Switch language" : "Basculer la langue"}
          className="group relative max-w-[calc(100vw-6rem)] overflow-hidden rounded-[1.35rem] border border-[rgba(159,20,22,0.14)] bg-[linear-gradient(135deg,rgba(255,250,242,0.98),rgba(255,244,228,0.94))] p-1 shadow-[0_14px_32px_rgba(20,10,8,0.16)] backdrop-blur sm:max-w-none sm:rounded-[1.7rem] sm:p-1.5 sm:shadow-[0_18px_45px_rgba(20,10,8,0.16)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(24,21,19,0.96),rgba(33,28,24,0.94))]"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(159,20,22,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(200,149,85,0.18),transparent_40%)] opacity-90 transition duration-300 group-hover:scale-110"
          />
          <span className="relative flex items-center gap-2 rounded-[1rem] bg-white/55 px-1.5 py-1.5 sm:gap-3 sm:rounded-[1.2rem] sm:px-2 sm:py-2 dark:bg-white/[0.04]">
            <span className="flex size-9 items-center justify-center rounded-[0.9rem] bg-[var(--brand-ink)] text-white shadow-[0_10px_22px_rgba(20,10,8,0.24)] sm:hidden">
              <Languages aria-hidden="true" className="size-4" />
            </span>
            <span className="hidden min-w-[4.5rem] text-left leading-none sm:grid">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-red)] dark:text-[color:var(--brand-bronze)]">
                {isEnglish ? "Language" : "Langue"}
              </span>
              <span className="mt-1 font-display text-sm font-semibold text-foreground">
                {isEnglish ? "English" : "Français"}
              </span>
            </span>
            <span className="relative flex rounded-full border border-black/5 bg-[rgba(23,21,19,0.06)] p-1 dark:border-white/10 dark:bg-white/[0.06]">
              <span
                aria-hidden="true"
                className={`absolute top-1 bottom-1 w-[calc(50%-0.125rem)] rounded-full bg-[var(--brand-ink)] shadow-[0_10px_22px_rgba(20,10,8,0.24)] transition-all duration-300 ${isEnglish ? "translate-x-full" : "translate-x-0"}`}
              />
              <span className={`relative z-10 rounded-full px-2.5 py-1.5 text-[0.7rem] font-bold transition sm:px-3 sm:text-xs ${!isEnglish ? "text-white" : "text-muted-foreground"}`}>
                FR
              </span>
              <span className={`relative z-10 rounded-full px-2.5 py-1.5 text-[0.7rem] font-bold transition sm:px-3 sm:text-xs ${isEnglish ? "text-white" : "text-muted-foreground"}`}>
                EN
              </span>
            </span>
          </span>
        </button>
      </div>

      {showScrollTop ? (
        <div
          data-no-translate
          className="fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 sm:right-5 sm:bottom-5"
        >
          <button
            type="button"
            onClick={scrollToTop}
            aria-label={isEnglish ? "Back to top" : "Retour en haut"}
            title={isEnglish ? "Back to top" : "Retour en haut"}
            className="group relative max-w-[calc(100vw-6rem)] overflow-hidden rounded-[1.25rem] border border-[rgba(159,20,22,0.14)] bg-[linear-gradient(135deg,rgba(255,250,242,0.97),rgba(243,230,210,0.94))] px-1.5 py-1.5 shadow-[0_14px_32px_rgba(20,10,8,0.16)] backdrop-blur sm:max-w-none sm:rounded-[1.6rem] sm:px-3 sm:py-2 sm:shadow-[0_18px_45px_rgba(20,10,8,0.16)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(24,21,19,0.96),rgba(33,28,24,0.94))]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(159,20,22,0.16),transparent_46%)] opacity-80 transition duration-300 group-hover:scale-110 group-hover:opacity-100"
            />
            <span className="relative flex items-center gap-2 sm:gap-3">
              <span className="flex size-10 items-center justify-center rounded-[0.95rem] bg-[var(--brand-ink)] text-white shadow-[0_12px_24px_rgba(20,10,8,0.28)] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_30px_rgba(20,10,8,0.34)] sm:size-11 sm:rounded-[1rem]">
                <ArrowUp aria-hidden="true" className="size-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 sm:size-5" />
              </span>
              <span className="hidden text-left leading-none sm:grid">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-red)] dark:text-[color:var(--brand-bronze)]">
                  {isEnglish ? "Return" : "Retour"}
                </span>
                <span className="mt-1 font-display text-base font-semibold text-foreground">
                  {isEnglish ? "To Top" : "En haut"}
                </span>
              </span>
            </span>
          </button>
        </div>
      ) : null}
    </>
  );
}
