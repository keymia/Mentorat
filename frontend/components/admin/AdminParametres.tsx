"use client";

import { FormEvent, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AdminMentorshipPeriods } from "@/components/admin/mentorship/AdminMentorshipPeriods";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ParametreSysteme,
  formatApiError,
  getParametres,
  updateParametre,
} from "@/lib/api";

type Drafts = Record<number, Pick<ParametreSysteme, "valeur" | "description">>;

const mentorshipPeriodKey = "MENTORSHIP_PERIODS";

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
  const requestedKey = searchParams.get("param");
  const [rows, setRows] = useState<ParametreSysteme[]>([]);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [selectedKey, setSelectedKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    getParametres()
      .then((parametres) => {
        if (isMounted) {
          setRows(parametres);
          setDrafts(buildDrafts(parametres));
          const availableKeys = new Set([...parametres.map((parametre) => parametre.cle), mentorshipPeriodKey]);
          setSelectedKey(requestedKey && availableKeys.has(requestedKey) ? requestedKey : mentorshipPeriodKey);
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
      setMessage(`Parametre ${updated.cle} mis a jour.`);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setSavingId(null);
    }
  }

  const selectedParametre = rows.find((row) => row.cle === selectedKey);
  const isMentorshipPeriodSelected = selectedKey === mentorshipPeriodKey;
  const pageTitle = isMentorshipPeriodSelected
    ? "Periode de mentorat"
    : selectedParametre
      ? `Parametre ${selectedParametre.cle}`
      : "Parametres systeme";
  const pageDescription = isMentorshipPeriodSelected
    ? "Creez ou modifiez les periodes utilisees pour les affectations, les seances et les suivis."
    : "Ajustez la valeur et la description du parametre selectionne.";

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold">{pageTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {pageDescription}
        </p>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {isLoading ? <Skeleton className="h-56" /> : null}

      {!isLoading && !error ? (
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
            <EmptyState icon={Settings} title="Aucun parametre systeme pour le moment." />
          ) : null}
        </div>
      ) : null}

      {isMentorshipPeriodSelected ? (
        <AdminMentorshipPeriods
          title="Periode de mentorat"
          description="Creez ou modifiez les periodes utilisees pour les affectations, les seances et les suivis."
          showHeader={false}
        />
      ) : null}
    </div>
  );
}
