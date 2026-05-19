"use client";

import { BookOpenCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { HelpAccordion } from "@/components/help/HelpAccordion";
import { useHelpLanguage } from "@/components/help/useHelpLanguage";
import { RevealOnScroll } from "@/components/public/RevealOnScroll";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatApiError, getCurrentUser } from "@/lib/api";
import { HelpScope, HelpRole, getHelpModulesForRole, helpUiText, normalizeHelpRole } from "@/lib/helpContent";

type HelpPageProps = {
  scope: HelpScope;
};

export function HelpPage({ scope }: HelpPageProps) {
  const language = useHelpLanguage();
  const [role, setRole] = useState<HelpRole | undefined>(scope === "mentor" ? "MENTOR" : undefined);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(scope === "admin");

  useEffect(() => {
    if (scope !== "admin") {
      return;
    }
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setRole(normalizeHelpRole(user.role_nom, scope));
          setError("");
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(formatApiError(apiError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [scope]);

  const modules = useMemo(() => getHelpModulesForRole(role, scope, language), [language, role, scope]);
  const ui = helpUiText[language];
  const roleLabel =
    role === "ADMIN_PRINCIPAL"
      ? ui.rolePrincipalLong
      : role === "ADMIN_OPERATIONNEL"
        ? ui.roleOperationalLong
        : ui.roleMentorLong;

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div data-no-translate className="grid gap-6">
      <RevealOnScroll>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{ui.documentationKicker}</p>
            <h1 className="mt-2 font-display text-3xl font-bold">{ui.pageTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {ui.guideDescription(roleLabel)}
            </p>
          </div>
          <Card className="public-motion-card w-full lg:w-72">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <BookOpenCheck aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{modules.length}</p>
                <p className="text-sm text-muted-foreground">{ui.modulesDocumented}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </RevealOnScroll>

      {error ? (
        <RevealOnScroll>
          <Alert variant="error">{error}</Alert>
        </RevealOnScroll>
      ) : null}

      <RevealOnScroll delayMs={80}>
        <Alert>{ui.noDashboardForMentees}</Alert>
      </RevealOnScroll>

      <HelpAccordion modules={modules} role={role} language={language} />
    </div>
  );
}
