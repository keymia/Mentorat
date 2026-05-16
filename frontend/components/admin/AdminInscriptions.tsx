"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, Search, X } from "lucide-react";

import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inscription,
  formatApiError,
  getAdminRegistrations,
  refuserInscription,
  validerInscription,
} from "@/lib/api";
import { displayUser, formatDateTime } from "@/lib/mentorship";

const pageSize = 10;

const registrationStatusLabels: Record<Inscription["registration_status"], string> = {
  registered: "Inscrit",
  pending_matching: "Jumelage requis",
  matched: "Jumele",
  completed: "Termine",
};

const inscriptionStatusLabels: Record<Inscription["statut_inscription"], string> = {
  EN_ATTENTE: "En attente",
  VALIDEE: "Validee",
  REFUSEE: "Refusee",
};

function matchingSummary(row: Inscription) {
  if (row.type_inscription === "MENTOR") {
    const count = row.utilisateur_detail?.nombre_mentores_actuels ?? 0;
    return {
      label: `${count} jumelage${count > 1 ? "s" : ""}`,
      variant: count > 0 ? ("success" as const) : ("outline" as const),
    };
  }

  const isMatched = Boolean(row.mentor_choisi || row.mentor_choisi_detail);
  return {
    label: isMatched ? "Jumele" : "En attente",
    variant: isMatched ? ("success" as const) : ("outline" as const),
  };
}

export function AdminInscriptions() {
  const [rows, setRows] = useState<Inscription[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<Inscription | null>(null);

  async function reloadRows() {
    const payload = await getAdminRegistrations({
      search,
      role: roleFilter,
      status: statusFilter,
    });
    setRows(payload);
  }

  useEffect(() => {
    let isMounted = true;
    getAdminRegistrations({ search, role: roleFilter, status: statusFilter })
      .then((payload) => {
        if (isMounted) {
          setRows(payload);
          setError("");
          setPage(1);
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
  }, [roleFilter, search, statusFilter]);

  const pageCount = Math.max(Math.ceil(rows.length / pageSize), 1);
  const visibleRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, rows]);

  async function handleAction(id: number, action: "valider" | "refuser") {
    setPendingId(id);
    setError("");
    setMessage("");
    try {
      if (action === "valider") {
        await validerInscription(id);
        setMessage("Inscription validee.");
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
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold">Inscriptions</h1>
          <HelpIconButton moduleKey="registrations" scope="admin" />
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Consultez les inscrits et reperez les dossiers qui demandent encore une action.
        </p>
      </div>

      <Card className="grid gap-3 p-4 lg:grid-cols-[1.4fr_180px_180px]">
        <label>
          Recherche
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              className="field pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, prenom ou email"
            />
          </span>
        </label>
        <label>
          Role
          <select className="field" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">Tous</option>
            <option value="MENTOR">Mentors</option>
            <option value="MENTORE">Mentorés</option>
          </select>
        </label>
        <label>
          Statut
          <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tous</option>
            {Object.entries(inscriptionStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {isLoading ? <Skeleton className="h-56" /> : null}

      {!isLoading && rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aucune inscription." />
      ) : null}

      {!isLoading && rows.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="list-table-max-five w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Jumelage</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleRows.map((row) => (
                  (() => {
                    const summary = matchingSummary(row);
                    return (
                      <tr key={row.id} className="align-top">
                        <td className="px-4 py-3 font-medium">{displayUser(row.utilisateur_detail)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.utilisateur_detail?.email ?? "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="bronze">{row.type_inscription}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(row.date_inscription)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={row.statut_inscription === "VALIDEE" ? "success" : "outline"}>
                            {inscriptionStatusLabels[row.statut_inscription]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={summary.variant}>{summary.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedRow(row)}>
                            Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>
              Page {page} sur {pageCount}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Precedent
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage((current) => current + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Modal
        open={Boolean(selectedRow)}
        title="Detail de l'inscription"
        description="Informations complètes du dossier inscrit."
        className="max-w-4xl"
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <div className="grid gap-5">
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
              <DetailItem label="Nom complet" value={displayUser(selectedRow.utilisateur_detail)} />
              <DetailItem label="Email" value={selectedRow.utilisateur_detail?.email ?? "Non renseigné"} />
              <DetailItem label="Role" value={selectedRow.type_inscription} />
              <DetailItem label="Statut inscription" value={inscriptionStatusLabels[selectedRow.statut_inscription]} />
              <DetailItem label="Niveau académique" value={selectedRow.utilisateur_detail?.niveau_academique_nom ?? "Non renseigné"} />
              <DetailItem label="Date inscription" value={formatDateTime(selectedRow.date_inscription)} />
              <DetailItem label="Période" value={selectedRow.mentorship_period_title ?? "Non renseignée"} />
              <DetailItem label="Mentor choisi" value={displayUser(selectedRow.mentor_choisi_detail)} />
              <DetailItem
                label="Association assigne un mentor"
                value={selectedRow.wants_association_assignment ? "Oui" : "Non"}
              />
              <DetailItem label="Besoin de jumelage" value={selectedRow.needs_matching ? "Oui" : "Non"} />
              <DetailItem label="Statut dossier" value={registrationStatusLabels[selectedRow.registration_status]} />
              <DetailItem
                label="Période terminée"
                value={selectedRow.completed_session_status === "completed" ? "Oui" : "Non"}
              />
            </div>

            {selectedRow.statut_inscription === "EN_ATTENTE" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={pendingId === selectedRow.id}
                  onClick={() => void handleAction(selectedRow.id, "valider")}
                >
                  <Check aria-hidden="true" />
                  Valider
                </Button>
                <Button
                  type="button"
                  disabled={pendingId === selectedRow.id}
                  onClick={() => void handleAction(selectedRow.id, "refuser")}
                  variant="outline"
                >
                  <X aria-hidden="true" />
                  Refuser
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
