import type { ReactNode } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { Language } from "@/lib/i18n";
import { HelpModule, HelpRole, helpUiText } from "@/lib/helpContent";

type HelpModuleViewProps = {
  module: HelpModule;
  role?: HelpRole;
  compact?: boolean;
  language: Language;
};

function NumberedList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ol className="grid list-decimal gap-2 pl-5 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="grid list-disc gap-2 pl-5 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function HelpSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function HelpModuleView({ module, role, compact = false, language }: HelpModuleViewProps) {
  const ui = helpUiText[language];

  return (
    <div className={compact ? "grid gap-4" : "grid gap-5"}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="bronze">
          {module.scope === "mentor" ? ui.scopeMentor : module.scope === "admin" ? ui.scopeAdmin : ui.scopeShared}
        </Badge>
        {module.roles.map((allowedRole) => (
          <Badge key={allowedRole} variant="outline">
            {allowedRole === "ADMIN_PRINCIPAL"
              ? ui.rolePrincipal
              : allowedRole === "ADMIN_OPERATIONNEL"
                ? ui.roleOperational
                : ui.roleMentor}
          </Badge>
        ))}
      </div>

      <HelpSection title={ui.objective}>
        <p className="text-sm leading-6 text-foreground">{module.objective}</p>
      </HelpSection>

      <HelpSection title={ui.whoCanUse}>
        <p className="text-sm leading-6 text-muted-foreground">{module.whoCanUse}</p>
      </HelpSection>

      {!compact ? (
        <HelpSection title={ui.actions}>
          <BulletList items={module.actions} />
        </HelpSection>
      ) : null}

      <HelpSection title={ui.steps}>
        <NumberedList items={module.steps} />
      </HelpSection>

      <HelpSection title={ui.rules}>
        <BulletList items={module.rules} />
      </HelpSection>

      {module.principalOnly?.length ? (
        <Alert variant={role === "ADMIN_OPERATIONNEL" ? "warning" : "info"}>
          <p className="font-semibold">
            {role === "ADMIN_OPERATIONNEL" ? ui.principalOnlyForOperational : ui.principalOnlyForAdmin}
          </p>
          {role === "ADMIN_OPERATIONNEL" && module.operationalNote ? (
            <p className="mt-1">{module.operationalNote}</p>
          ) : null}
          <ul className="mt-2 list-disc pl-5">
            {module.principalOnly.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <HelpSection title={ui.attention}>
        <BulletList items={module.attention} />
      </HelpSection>
    </div>
  );
}
