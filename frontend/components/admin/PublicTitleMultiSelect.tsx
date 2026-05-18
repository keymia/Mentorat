"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CUSTOM_PUBLIC_TITLE_OPTION,
  PUBLIC_TITLE_OPTIONS,
  resolvePublicTitles,
  type PublicTitleOption,
} from "@/lib/publicAdminProfile";

type PublicTitleMultiSelectProps = {
  selectedTitles: PublicTitleOption[];
  customTitle: string;
  onSelectedTitlesChange: (titles: PublicTitleOption[]) => void;
  onCustomTitleChange: (title: string) => void;
  required?: boolean;
};

export function PublicTitleMultiSelect({
  selectedTitles,
  customTitle,
  onSelectedTitlesChange,
  onCustomTitleChange,
  required = false,
}: PublicTitleMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const menuId = useId();
  const resolvedTitle = resolvePublicTitles(selectedTitles, customTitle);
  const hasCustomTitle = selectedTitles.includes(CUSTOM_PUBLIC_TITLE_OPTION);

  useEffect(() => {
    if (!hasCustomTitle && customTitle) {
      onCustomTitleChange("");
    }
  }, [customTitle, hasCustomTitle, onCustomTitleChange]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function toggleTitle(title: PublicTitleOption) {
    if (selectedTitles.includes(title)) {
      onSelectedTitlesChange(selectedTitles.filter((selectedTitle) => selectedTitle !== title));
      if (title === CUSTOM_PUBLIC_TITLE_OPTION) {
        onCustomTitleChange("");
      }
      return;
    }
    onSelectedTitlesChange([...selectedTitles, title]);
  }

  function removeTitle(title: PublicTitleOption) {
    onSelectedTitlesChange(selectedTitles.filter((selectedTitle) => selectedTitle !== title));
    if (title === CUSTOM_PUBLIC_TITLE_OPTION) {
      onCustomTitleChange("");
    }
  }

  return (
    <div ref={rootRef} className="relative grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span id={labelId} className="text-sm font-medium text-foreground">
          Titre / diplôme
        </span>
        {selectedTitles.length > 0 ? (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {selectedTitles.length}
          </span>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-background text-sm shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:bg-card">
        <div className="flex min-h-12 items-center gap-2 px-3 py-2">
          <div className="flex flex-1 flex-wrap gap-2" aria-live="polite">
            {selectedTitles.length > 0 ? (
              selectedTitles.map((title) => {
                const displayTitle =
                  title === CUSTOM_PUBLIC_TITLE_OPTION && customTitle.trim()
                    ? customTitle.trim()
                    : title;
                return (
                  <span
                    key={title}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/15 bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground shadow-sm"
                  >
                    <span className="truncate">{displayTitle}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        removeTitle(title);
                      }}
                      aria-label={`Retirer ${displayTitle}`}
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                );
              })
            ) : (
              <span className="text-muted-foreground">Aucun titre sélectionné</span>
            )}
          </div>
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:border-accent hover:bg-muted hover:text-foreground"
            aria-labelledby={labelId}
            aria-controls={menuId}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            onClick={() => setIsOpen((current) => !current)}
          >
            <ChevronDown
              className={cn("size-4 transition-transform duration-200", isOpen ? "rotate-180" : "")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          id={menuId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl"
        >
          <div className="max-h-72 overflow-y-auto p-2">
            {PUBLIC_TITLE_OPTIONS.map((option) => {
              const isSelected = selectedTitles.includes(option);
              return (
                <label
                  key={option}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
                    isSelected ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTitle(option)}
                    className="size-4 rounded border-border accent-primary"
                  />
                  <span className="flex-1 font-medium">{option}</span>
                  {isSelected ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasCustomTitle ? (
        <label className="grid gap-1 rounded-lg border border-border bg-muted/30 p-3">
          <span className="text-sm font-medium text-foreground">Titre ou diplôme personnalisé</span>
          <input
            className="field"
            required={required}
            value={customTitle}
            onChange={(event) => onCustomTitleChange(event.target.value)}
          />
        </label>
      ) : null}
      {resolvedTitle ? (
        <p className="text-xs text-muted-foreground">Affichage : {resolvedTitle}</p>
      ) : null}
    </div>
  );
}
