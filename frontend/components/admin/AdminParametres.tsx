"use client";

import { FormEvent, useEffect, useState } from "react";
import { Settings } from "lucide-react";

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
  const [rows, setRows] = useState<ParametreSysteme[]>([]);
  const [drafts, setDrafts] = useState<Drafts>({});
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
  }, []);

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

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Gestion parametres</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Ajustez les valeurs systeme utilisees par les regles de mentorat.
        </p>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {isLoading ? <Skeleton className="h-56" /> : null}

      {!isLoading && !error ? (
        <div className="grid gap-4">
          {rows.length === 0 ? (
            <EmptyState icon={Settings} title="Aucun parametre systeme pour le moment." />
          ) : (
            rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="p-4">
                  <form onSubmit={(event) => void handleSubmit(event, row)}>
                    <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
                      <div>
                        <p className="font-mono text-sm font-semibold text-foreground">{row.cle}</p>
                        <label className="mt-4">
                          Valeur
                          <input
                            className="field"
                            value={drafts[row.id]?.valeur ?? ""}
                            onChange={(event) => updateDraft(row.id, "valeur", event.target.value)}
                          />
                        </label>
                        <label className="mt-4">
                          Description
                          <textarea
                            className="field"
                            rows={3}
                            value={drafts[row.id]?.description ?? ""}
                            onChange={(event) => updateDraft(row.id, "description", event.target.value)}
                          />
                        </label>
                      </div>
                      <div className="flex items-start lg:justify-end">
                        <Button type="submit" disabled={savingId === row.id}>
                          {savingId === row.id ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
