"use client";

import { FormEvent, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AdminAccountSettings } from "@/components/admin/AdminAccountSettings";
import { useHydrated } from "@/components/layout/useHydrated";
import { AdminMentorshipPeriods } from "@/components/admin/mentorship/AdminMentorshipPeriods";
import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ParametreSysteme,
  formatApiError,
  getCurrentUser,
  getParametres,
  updateParametre,
  type UtilisateurDetail,
} from "@/lib/api";

type Drafts = Record<number, Pick<ParametreSysteme, "valeur" | "description">>;

const mentorshipPeriodKey = "MENTORSHIP_PERIODS";
const legacyMaxMenteesKey = "MAX_MENTORES_PAR_MENTOR";

function buildDrafts(rows: ParametreSysteme[]) {
  return rows.reduce<Drafts>((accumulator, row) => {
    accumulator[row.id] = {
      valeur: row.valeur,
      description: row.description,
    };
    return accumulator;
  }, {});
}

export function AdminParametres() {
  const searchParams = useSearchParams();
  const isHydrated = useHydrated();
  const requestedKey = searchParams.get("param");
  const [rows, setRows] = useState<ParametreSysteme[]>([]);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [selectedKey, setSelectedKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UtilisateurDetail | null>(null);
  const translationGuardProps = !isHydrated ? { "data-no-translate": true } : {};

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const user = await getCurrentUser();
        if (!isMounted) {
          return;
        }
        setCurrentUser(user);
        if (user.role_nom !== "ADMIN_PRINCIPAL") {
          setRows([]);
          setDrafts({});
          setSelectedKey("ACCOUNT");
          setError("");
          return;
        }
        const parametres = await getParametres();
        if (!isMounted) {
          return;
        }
        const visibleParametres = parametres.filter((parametre) => parametre.cle !== legacyMaxMenteesKey);
        setRows(visibleParametres);
        setDrafts(buildDrafts(visibleParametres));
        const availableKeys = new Set([...visibleParametres.map((parametre) => parametre.cle), mentorshipPeriodKey, "ACCOUNT"]);
        setSelectedKey(requestedKey && availableKeys.has(requestedKey) ? requestedKey : "ACCOUNT");
        setError("");
      } catch (apiError) {
        if (isMounted) {
          setError(formatApiError(apiError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    void loadSettings();
    return () => {
      isMounted = false;
    };
  }, [requestedKey]);

  function updateDraft(id: number, field: "valeur" | "description", value: string) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [id]: {
        ...currentDrafts[id],
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, row: ParametreSysteme) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSavingId(row.id);

    try {
      const updated = await updateParametre(row.id, drafts[row.id]);
      setRows((currentRows) => currentRows.map((item) => (item.id === updated.id ? updated : item)));
      setDrafts((currentDrafts) => ({
        ...currentDrafts,
        [updated.id]: {
          valeur: updated.valeur,
          description: updated.description,
        },
      }));
      setMessage(`Paramètre ${updated.cle} mis à jour.`);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setSavingId(null);
    }
  }

  const selectedParametre = rows.find((row) => row.cle === selectedKey);
  const isAdminPrincipal = currentUser?.role_nom === "ADMIN_PRINCIPAL";
  const isMentorshipPeriodSelected = selectedKey === mentorshipPeriodKey;
  const pageTitle = isMentorshipPeriodSelected
    ? "Période de mentorat"
    : selectedParametre
      ? `Paramètre ${selectedParametre.cle}`
      : "Paramètres système";
  const pageDescription = isMentorshipPeriodSelected
    ? "Créez ou modifiez les périodes utilisées pour les affectations, les séances et les suivis."
    : "Ajustez la valeur et la description du paramètre sélectionné.";

  if (isLoading) {
    return (
      <div className="contents" {...translationGuardProps}>
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="contents" {...translationGuardProps}>
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!isAdminPrincipal) {
    return (
      <div className="contents" {...translationGuardProps}>
        <AdminAccountSettings />
      </div>
    );
  }

  if (selectedKey === "ACCOUNT") {
    return (
      <div className="contents" {...translationGuardProps}>
        <AdminAccountSettings />
      </div>
    );
  }

  return (
    <div className="grid gap-5" {...translationGuardProps}>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold">{pageTitle}</h1>
          <HelpIconButton moduleKey={isMentorshipPeriodSelected ? "periods" : "settings"} scope="admin" />
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {pageDescription}
        </p>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      {!error ? (
        <div className="grid gap-4">
          {selectedParametre && !isMentorshipPeriodSelected ? (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={(event) => void handleSubmit(event, selectedParametre)}>
                  <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
                    <div>
                      <label>
                        Valeur
                        <input
                          className="field"
                          value={drafts[selectedParametre.id]?.valeur ?? ""}
                          onChange={(event) => updateDraft(selectedParametre.id, "valeur", event.target.value)}
                        />
                      </label>
                      <label className="mt-4">
                        Description
                        <textarea
                          className="field"
                          rows={3}
                          value={drafts[selectedParametre.id]?.description ?? ""}
                          onChange={(event) => updateDraft(selectedParametre.id, "description", event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="flex items-start lg:justify-end">
                      <Button type="submit" disabled={savingId === selectedParametre.id}>
                        {savingId === selectedParametre.id ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {rows.length === 0 && selectedKey !== mentorshipPeriodKey ? (
            <EmptyState icon={Settings} title="Aucun paramètre système pour le moment." />
          ) : null}
        </div>
      ) : null}

      {isMentorshipPeriodSelected ? (
        <AdminMentorshipPeriods
          title="Période de mentorat"
          description="Créez ou modifiez les périodes utilisées pour les affectations, les séances et les suivis."
          showHeader={false}
        />
      ) : null}
    </div>
  );
}
