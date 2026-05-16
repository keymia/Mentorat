"use client";

import { ChevronDown } from "lucide-react";

import { HelpModuleView } from "@/components/help/HelpModuleView";
import type { Language } from "@/lib/i18n";
import { HelpModule, HelpRole } from "@/lib/helpContent";

type HelpAccordionProps = {
  modules: HelpModule[];
  role?: HelpRole;
  language: Language;
};

export function HelpAccordion({ modules, role, language }: HelpAccordionProps) {
  return (
    <div className="grid gap-3">
      {modules.map((module, index) => (
        <details
          key={module.key}
          className="group rounded-xl border border-border bg-card text-card-foreground shadow-card"
          open={index === 0}
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 outline-none transition hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-normal">{module.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{module.objective}</p>
            </div>
            <ChevronDown
              className="mt-1 size-5 shrink-0 text-muted-foreground transition group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t border-border p-5">
            <HelpModuleView module={module} role={role} language={language} />
          </div>
        </details>
      ))}
    </div>
  );
}
