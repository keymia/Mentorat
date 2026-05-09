"use client";

import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatApiError, getAdminCollection } from "@/lib/api";

type UserRow = {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  langue_preferee?: string;
  region?: string;
  profil_mentorat?: string;
  capacite_mentorat?: number;
  nombre_mentores_actuels?: number;
  capacite_restante?: number;
  statut_compte?: string;
  niveau_academique_nom?: string;
};

type AdminUsersListProps = {
  title: string;
  description: string;
  endpoint: string;
  emptyMessage: string;
  showCapacity?: boolean;
};

function normalizeRows(payload: Record<string, unknown>[] | { results?: Record<string, unknown>[] }) {
  const rows = Array.isArray(payload) ? payload : payload.results ?? [];
  return rows as UserRow[];
}

function fullName(row: UserRow) {
  return `${row.prenom ?? ""} ${row.nom ?? ""}`.trim() || "Utilisateur sans nom";
}

function capacityLabel(row: UserRow) {
  const current = row.nombre_mentores_actuels ?? 0;
  const total = row.capacite_mentorat ?? 0;
  const remaining = row.capacite_restante ?? Math.max(total - current, 0);
  return `${current}/${total} occupes, ${remaining} disponible${remaining > 1 ? "s" : ""}`;
}

export function AdminUsersList({
  title,
  description,
  endpoint,
  emptyMessage,
  showCapacity = false,
}: AdminUsersListProps) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getAdminCollection(endpoint)
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
  }, [endpoint]);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      {isLoading ? <Skeleton className="h-56" /> : null}
      {error ? <p className="notice error">{error}</p> : null}

      {!isLoading && !error ? (
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-muted px-4 py-3 text-sm font-medium">
            {rows.length} profil{rows.length > 1 ? "s" : ""}
          </div>

          {rows.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={UsersRound} title={emptyMessage} />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <CardContent key={row.id} className="grid gap-3 p-4 lg:grid-cols-[1.2fr_1fr_1fr]">
                  <div>
                    <h2 className="font-semibold text-foreground">{fullName(row)}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{row.email ?? "Email non renseigne"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{row.telephone ?? "Telephone non renseigne"}</p>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Niveau:</span>{" "}
                      {row.niveau_academique_nom ?? "Non renseigne"}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Region:</span> {row.region || "Non renseignee"}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Langue:</span> {row.langue_preferee || "Non renseignee"}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{row.statut_compte ?? "Non renseigne"}</Badge>
                      <Badge variant="bronze">{row.profil_mentorat ?? "Non renseigne"}</Badge>
                    </div>
                    {showCapacity ? (
                      <p className="mt-1">
                        <span className="font-medium text-foreground">Capacite:</span> {capacityLabel(row)}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
