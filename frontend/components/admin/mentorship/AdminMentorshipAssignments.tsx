"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, Handshake, RefreshCcw, Search, UserCheck } from "lucide-react";

import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminMatchingResponse,
  AdminMatchingRow,
  AdminMatchingStatus,
  formatApiError,
  getAdminMatching,
  getAdminMatchingDetails,
  reassignAdminMatching,
} from "@/lib/api";
import { assignmentStatusLabels, displayUser, formatDate, formatDateTime } from "@/lib/mentorship";

const pageSize = 10;

const matchingStatusLabels: Record<AdminMatchingStatus, string> = {
  assigned: "Assigne",
  pending_matching: "En attente de jumelage",
  association_choice: "Association doit choisir",
  unassigned: "Non assigne",
  completed: "Termine",
};

const matchingStatusVariants: Record<AdminMatchingStatus, "success" | "outline" | "bronze" | "secondary"> = {
  assigned: "success",
  pending_matching: "outline",
  association_choice: "bronze",
  unassigned: "outline",
  completed: "secondary",
};

function assignedMentor(row: AdminMatchingRow) {
  return row.current_mentor ?? row.inscription.mentor_choisi_detail ?? null;
}

function periodTitle(row: AdminMatchingRow) {
  return row.period?.title ?? row.inscription.mentorship_period_title ?? "Non renseignée";
}

function periodId(row: AdminMatchingRow) {
  return row.period?.id ?? row.inscription.mentorship_period ?? null;
}

function rowMatchesSearch(row: AdminMatchingRow, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) {
    return true;
  }
  const mentor = assignedMentor(row);
  return [
    displayUser(row.mentee),
    row.mentee.email,
    row.mentee.niveau_academique_nom,
    periodTitle(row),
    displayUser(mentor),
    matchingStatusLabels[row.matching_status],
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

export function AdminMentorshipAssignments() {
  const [data, setData] = useState<AdminMatchingResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<AdminMatchingRow | null>(null);
  const [detailsRow, setDetailsRow] = useState<AdminMatchingRow | null>(null);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);

  async function loadData(period = selectedPeriod) {
    setIsLoading(true);
    try {
      const matchingData = await getAdminMatching(period || undefined);
      setData(matchingData);
      setError("");
      setPage(1);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    getAdminMatching(selectedPeriod || undefined)
      .then((matchingData) => {
        if (isMounted) {
          setData(matchingData);
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
  }, [selectedPeriod]);

  const filteredRows = useMemo(
    () => (data?.results ?? []).filter((row) => rowMatchesSearch(row, search)),
    [data?.results, search],
  );
  const pageCount = Math.max(Math.ceil(filteredRows.length / pageSize), 1);
  const visibleRows = useMemo(
    () => filteredRows.slice((page - 1) * pageSize, page * pageSize),
    [filteredRows, page],
  );

  function openReassignModal(row: AdminMatchingRow) {
    setSelectedRow(row);
    setSelectedMentor(row.compatible_mentors[0] ? String(row.compatible_mentors[0].id) : "");
    setError("");
    setMessage("");
  }

  function closeReassignModal() {
    setSelectedRow(null);
    setSelectedMentor("");
  }

  async function openDetailsModal(row: AdminMatchingRow) {
    setDetailsRow(row);
    setError("");
    try {
      const details = await getAdminMatchingDetails(row.mentee.id, periodId(row) ?? undefined);
      setDetailsRow(details);
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  async function handleReassign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sessionId = selectedRow ? periodId(selectedRow) : null;
    if (!selectedRow || !selectedMentor || !sessionId) {
      return;
    }
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await reassignAdminMatching(selectedRow.mentee.id, {
        new_mentor_id: Number(selectedMentor),
        session_id: Number(sessionId),
      });
      setMessage("Jumelage mis à jour.");
      closeReassignModal();
      await loadData();
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Jumelage</h1>
            <HelpIconButton moduleKey="matching" scope="admin" />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Consultez tous les mentorés et ajustez les affectations de mentorat par période.
          </p>
        </div>
        <Button type="button" variant="outline" className="w-fit" onClick={() => void loadData()}>
          <RefreshCcw aria-hidden="true" />
          Actualiser
        </Button>
      </div>

      <Card className={data?.show_session_filter ? "grid gap-3 p-4 lg:grid-cols-[1.4fr_220px]" : "grid gap-3 p-4"}>
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
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Nom, email, niveau ou mentor"
            />
          </span>
        </label>
        {data?.show_session_filter ? (
          <label>
            Période
            <select className="field" value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value)}>
              <option value="">Période active ou la plus récente</option>
              {data.periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </Card>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {isLoading ? <Skeleton className="h-56" /> : null}

      {!isLoading && filteredRows.length === 0 ? (
        <EmptyState icon={UserCheck} title="Aucun mentoré à afficher." />
      ) : null}

      {!isLoading && filteredRows.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Mentoré</th>
                  <th className="px-4 py-3">Niveau académique</th>
                  <th className="px-4 py-3">Période</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleRows.map((row) => {
                  return (
                    <tr key={`${row.inscription.id}-${row.period?.id ?? "none"}`} className="align-top">
                      <td className="px-4 py-3 font-medium">{displayUser(row.mentee)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.mentee.niveau_academique_nom ?? "Non renseigné"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{periodTitle(row)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={matchingStatusVariants[row.matching_status]}>
                          {matchingStatusLabels[row.matching_status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => void openDetailsModal(row)}>
                            <Eye aria-hidden="true" />
                            Détails
                          </Button>
                          <Button type="button" size="sm" onClick={() => openReassignModal(row)}>
                            <Handshake aria-hidden="true" />
                            Réassignation
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>
              Page {page} sur {pageCount}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Précédent
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
        title="Réassignation"
        description="Choisissez un nouveau mentor compatible avec le niveau du mentoré."
        onClose={closeReassignModal}
      >
        <form onSubmit={handleReassign} className="grid gap-4">
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
            <DetailItem label="Mentoré concerné" value={displayUser(selectedRow?.mentee)} />
            <DetailItem label="Période" value={selectedRow ? periodTitle(selectedRow) : "Non renseignée"} />
            <DetailItem label="Mentor actuel" value={displayUser(selectedRow ? assignedMentor(selectedRow) : null)} />
            <DetailItem
              label="Niveau académique"
              value={selectedRow?.mentee.niveau_academique_nom ?? "Non renseigné"}
            />
          </div>

          {selectedRow?.compatible_mentors.length ? (
            <label>
              Nouveau mentor
              <select className="field" required value={selectedMentor} onChange={(event) => setSelectedMentor(event.target.value)}>
                {selectedRow.compatible_mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {displayUser(mentor)} - {mentor.niveau_academique_nom} ({mentor.capacite_restante} place
                    {mentor.capacite_restante > 1 ? "s" : ""})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Alert variant="error">Aucun mentor compatible avec une capacité disponible pour cette période.</Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSaving || !selectedMentor || !selectedRow?.compatible_mentors.length}>
              <Handshake aria-hidden="true" />
              {isSaving ? "Mise à jour..." : "Confirmer"}
            </Button>
            <Button type="button" variant="outline" onClick={closeReassignModal}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailsRow)}
        title="Détails du jumelage"
        description="Informations du mentoré, de la période et des affectations."
        className="max-w-4xl"
        onClose={() => setDetailsRow(null)}
      >
        {detailsRow ? (
          <div className="grid gap-5">
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
              <DetailItem label="Mentoré" value={displayUser(detailsRow.mentee)} />
              <DetailItem label="Email" value={detailsRow.mentee.email || "Non renseigné"} />
              <DetailItem label="Niveau académique" value={detailsRow.mentee.niveau_academique_nom ?? "Non renseigné"} />
              <DetailItem label="Période active" value={periodTitle(detailsRow)} />
              <DetailItem label="Mentor actuel" value={displayUser(assignedMentor(detailsRow))} />
              <DetailItem label="Statut du jumelage" value={matchingStatusLabels[detailsRow.matching_status]} />
              <DetailItem label="Date inscription" value={formatDateTime(detailsRow.inscription.date_inscription)} />
              <DetailItem
                label="Dates de période"
                value={`${formatDate(detailsRow.period?.start_date)} - ${formatDate(detailsRow.period?.end_date)}`}
              />
              <DetailItem
                label="Association choisit"
                value={detailsRow.inscription.wants_association_assignment ? "Oui" : "Non"}
              />
              <DetailItem label="Besoin de jumelage" value={detailsRow.inscription.needs_matching ? "Oui" : "Non"} />
            </div>

            <Card className="overflow-hidden">
              <div className="border-b border-border bg-muted/50 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Historique des affectations</p>
              </div>
              {detailsRow.assignment_history?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Mentor</th>
                        <th className="px-4 py-3">Statut</th>
                        <th className="px-4 py-3">Date affectation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detailsRow.assignment_history.map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-4 py-3 font-medium">{displayUser(assignment.mentor_detail)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={assignment.status === "active" ? "success" : "outline"}>
                              {assignmentStatusLabels[assignment.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDateTime(assignment.assigned_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <EmptyState icon={Handshake} title="Aucune affectation enregistree." />
                </div>
              )}
            </Card>
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
