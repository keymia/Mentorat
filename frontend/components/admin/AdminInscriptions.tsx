"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, X } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatApiError,
  getAdminCollection,
  refuserInscription,
  validerInscription,
} from "@/lib/api";

type UtilisateurDetail = {
  nom?: string;
  prenom?: string;
  email?: string;
  niveau_academique_nom?: string;
};

type InscriptionRow = {
  id: number;
  type_inscription: string;
  statut_inscription: string;
  date_inscription: string;
  utilisateur_detail?: UtilisateurDetail;
  mentor_choisi_detail?: UtilisateurDetail | null;
};

function normalizeRows(payload: Record<string, unknown>[] | { results?: Record<string, unknown>[] }) {
  const rows = Array.isArray(payload) ? payload : payload.results ?? [];
  return rows as InscriptionRow[];
}

function displayUser(user?: UtilisateurDetail | null) {
  if (!user) {
    return "Non renseigne";
  }
  return `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || user.email || "Utilisateur";
}

export function AdminInscriptions() {
  const [rows, setRows] = useState<InscriptionRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function reloadRows() {
    const payload = await getAdminCollection("/inscriptions/");
    setRows(normalizeRows(payload));
  }

  useEffect(() => {
    let isMounted = true;
    getAdminCollection("/inscriptions/")
      .then((payload) => {
        if (isMounted) {
          setRows(normalizeRows(payload));
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

  async function handleAction(id: number, action: "valider" | "refuser") {
    setPendingId(id);
    setError("");
    setMessage("");
    try {
      if (action === "valider") {
        await validerInscription(id);
        setMessage("Inscription validee. Si c'est un mentore, le jumelage actif a ete cree automatiquement.");
      } else {
        await refuserInscription(id);
        setMessage("Inscription refusee.");
      }
      await reloadRows();
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Gestion inscriptions</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Validez les inscriptions. La validation d&apos;un mentore avec mentor choisi cree automatiquement le jumelage.
        </p>
      </div>
      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {isLoading ? <Skeleton className="h-56" /> : null}
      {!isLoading && rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aucune inscription." />
      ) : null}
      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <Badge variant="bronze">{row.type_inscription}</Badge>
                <h2 className="mt-3 text-lg font-semibold">{displayUser(row.utilisateur_detail)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{row.utilisateur_detail?.email}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Niveau: {row.utilisateur_detail?.niveau_academique_nom ?? "Non renseigne"}
                </p>
                {row.type_inscription === "MENTORE" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mentor choisi: {displayUser(row.mentor_choisi_detail)}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2 md:justify-items-end">
                <Badge variant={row.statut_inscription === "EN_ATTENTE" ? "outline" : "success"}>
                  {row.statut_inscription}
                </Badge>
                {row.statut_inscription === "EN_ATTENTE" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={pendingId === row.id}
                      onClick={() => void handleAction(row.id, "valider")}
                      size="sm"
                    >
                      <Check aria-hidden="true" />
                      Valider
                    </Button>
                    <Button
                      type="button"
                      disabled={pendingId === row.id}
                      onClick={() => void handleAction(row.id, "refuser")}
                      variant="outline"
                      size="sm"
                    >
                      <X aria-hidden="true" />
                      Refuser
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
