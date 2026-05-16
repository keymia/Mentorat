"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  onClose: () => void;
};

export function Modal({ open, title, description, children, className, closeLabel = "Fermer", onClose }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 grid max-h-[calc(100vh-2rem)] w-full max-w-3xl gap-5 overflow-y-auto rounded-xl border border-border bg-card p-5 text-card-foreground shadow-card",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-xl font-semibold tracking-normal">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={closeLabel} onClick={onClose}>
            <X aria-hidden="true" />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
