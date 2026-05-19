"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Save, Trash2, UsersRound } from "lucide-react";
import Image from "next/image";

import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";
import {
  AdminTeamMember,
  UtilisateurDetail,
  deleteUtilisateur,
  formatApiError,
  getAdminTeamMembers,
  getCurrentUser,
  updateAdminTeamMember,
} from "@/lib/api";

type Drafts = Record<number, { is_team_approved: boolean; team_display_order: string }>;

function buildDrafts(rows: AdminTeamMember[]): Drafts {
  return Object.fromEntries(
    rows.map((row) => [
      row.id,
      {
        is_team_approved: row.is_team_approved,
        team_display_order: String(row.team_display_order ?? 0),
      },
    ]),
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AdminTeamMembers() {
  const [rows, setRows] = useState<AdminTeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<UtilisateurDetail | null>(null);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [detailsRow, setDetailsRow] = useState<AdminTeamMember | null>(null);
  const [editingRow, setEditingRow] = useState<AdminTeamMember | null>(null);
  const [rowToDelete, setRowToDelete] = useState<AdminTeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isAdminPrincipal = currentUser?.role_nom === "ADMIN_PRINCIPAL";

  const pendingRows = useMemo(() => rows.filter((row) => !row.is_team_approved), [rows]);
  const approvedRows = useMemo(
    () =>
      rows
        .filter((row) => row.is_team_approved)
        .sort((first, second) => (first.team_display_order || 0) - (second.team_display_order || 0)),
    [rows],
  );
  const pendingPagination = usePagination(pendingRows, 8);
  const approvedPagination = usePagination(approvedRows, 8);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getAdminTeamMembers(), getCurrentUser()])
      .then(([teamMembers, user]) => {
        if (isMounted) {
          setRows(teamMembers);
          setCurrentUser(user);
          setDrafts(buildDrafts(teamMembers));
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

  function updateDraft(id: number, field: keyof Drafts[number], value: string | boolean) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, row: AdminTeamMember, closeAfterSave = false) {
    event.preventDefault();
    const draft = drafts[row.id];
    if (!draft) {
      return;
    }
    setSavingId(row.id);
    setError("");
    setMessage("");
    try {
      const updated = await updateAdminTeamMember(row.id, {
        is_team_approved: draft.is_team_approved,
        team_display_order: Number(draft.team_display_order || 0),
      });
      setRows((currentRows) => currentRows.map((item) => (item.id === row.id ? updated : item)));
      setDrafts((current) => ({
        ...current,
        [row.id]: {
          is_team_approved: updated.is_team_approved,
          team_display_order: String(updated.team_display_order ?? 0),
        },
      }));
      setMessage(`Affichage public mis à jour pour ${row.nom_complet}.`);
      if (closeAfterSave) {
        setEditingRow(null);
      }
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(row: AdminTeamMember) {
    setIsDeleting(true);
    setError("");
    setMessage("");
    try {
      await deleteUtilisateur(row.id, "mentor");
      setRows((currentRows) => currentRows.filter((item) => item.id !== row.id));
      setDetailsRow(null);
      setEditingRow((current) => (current?.id === row.id ? null : current));
      setRowToDelete(null);
      setMessage("Mentor désactivé. Ses mentorés sont replacés en attente d’assignation.");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsDeleting(false);
    }
  }

  function avatar(row: AdminTeamMember, className = "size-12") {
    return (
      <div className={`${className} shrink-0 overflow-hidden rounded-lg bg-muted`}>
        {row.profile_photo_url ? (
          <Image
            src={row.profile_photo_url}
            alt={row.nom_complet}
            width={320}
            height={320}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-base font-bold text-primary">
            {initials(row.nom_complet)}
          </div>
        )}
      </div>
    );
  }

  function editForm(row: AdminTeamMember, closeAfterSave = false) {
    const draft = drafts[row.id] ?? {
      is_team_approved: row.is_team_approved,
      team_display_order: String(row.team_display_order ?? 0),
    };

    return (
      <form onSubmit={(event) => void handleSubmit(event, row, closeAfterSave)} className="grid gap-3">
        <label>
          Affichage public
          <select
            className="field"
            value={draft.is_team_approved ? "true" : "false"}
            onChange={(event) => updateDraft(row.id, "is_team_approved", event.target.value === "true")}
          >
            <option value="false">Refuse ou desactive</option>
            <option value="true">Accepte</option>
          </select>
        </label>
        <label>
          Ordre d&apos;affichage
          <input
            className="field"
            type="number"
            min={0}
            value={draft.team_display_order}
            onChange={(event) => updateDraft(row.id, "team_display_order", event.target.value)}
          />
        </label>
        <Button type="submit" className="w-fit" disabled={savingId === row.id}>
          <Save aria-hidden="true" />
          {savingId === row.id ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    );
  }

  return (
    <div className="grid gap-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold">Gestion des equipes</h1>
          <HelpIconButton moduleKey="teams" scope="admin" />
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Validez les mentors qui ont accepte d&apos;apparaitre publiquement et definissez leur ordre d&apos;affichage.
        </p>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      {!isLoading && !error ? (
        rows.length === 0 ? (
          <Card>
            <CardContent className="p-5">
              <EmptyState icon={UsersRound} title="Aucun mentor n'a demande l'affichage public." />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingRows.length > 0 ? (
              <ListTable
                title="Demandes à traiter"
                countLabel={`${pendingRows.length} demande${pendingRows.length > 1 ? "s" : ""}`}
                minWidth={820}
                footer={
                  pendingPagination.pageCount > 1 ? (
                    <PaginationControls
                      page={pendingPagination.page}
                      pageCount={pendingPagination.pageCount}
                      onPageChange={pendingPagination.setPage}
                    />
                  ) : null
                }
                headers={[
                  { label: "Mentor" },
                  { label: "Niveau académique" },
                  { label: "Domaine" },
                  { label: "Statut" },
                  { label: "Actions", className: "text-right" },
                ]}
              >
                {pendingPagination.visibleItems.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {avatar(row)}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{row.nom_complet}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.niveau_academique_nom || "Non renseigné"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.domaine_specialite || "Non renseigné"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">En attente</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setDetailsRow(row)}>
                          <Eye aria-hidden="true" />
                          Details
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditingRow(row)}>
                          <Pencil aria-hidden="true" />
                          Modifier
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </ListTable>
            ) : null}

            {approvedRows.length > 0 ? (
              <ListTable
                title="Mentors affichés"
                countLabel={`${approvedRows.length} mentor${approvedRows.length > 1 ? "s" : ""}`}
                minWidth={820}
                footer={
                  approvedPagination.pageCount > 1 ? (
                    <PaginationControls
                      page={approvedPagination.page}
                      pageCount={approvedPagination.pageCount}
                      onPageChange={approvedPagination.setPage}
                    />
                  ) : null
                }
                headers={[
                  { label: "Mentor" },
                  { label: "Niveau académique" },
                  { label: "Ordre" },
                  { label: "Statut" },
                  { label: "Actions", className: "text-right" },
                ]}
              >
                {approvedPagination.visibleItems.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {avatar(row)}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{row.nom_complet}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.niveau_academique_nom || "Non renseigné"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.team_display_order || 0}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">Valide</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setDetailsRow(row)}>
                          <Eye aria-hidden="true" />
                          Details
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditingRow(row)}>
                          <Pencil aria-hidden="true" />
                          Modifier
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </ListTable>
            ) : null}

            {pendingRows.length === 0 && approvedRows.length === 0 ? (
              <Card>
                <CardContent className="p-5">
                  <EmptyState icon={UsersRound} title="Aucune demande d'affichage à traiter." />
                </CardContent>
              </Card>
            ) : null}
          </div>
        )
      ) : null}

      <Modal
        open={Boolean(detailsRow)}
        title={detailsRow?.nom_complet ?? "Détails du mentor"}
        description="Informations du profil public Équipes."
        onClose={() => setDetailsRow(null)}
      >
        {detailsRow ? (
          <div className="grid gap-4">
            <div className="flex items-start gap-4">
              {avatar(detailsRow, "size-24")}
              <div className="grid gap-2">
                <Badge variant={detailsRow.is_team_approved ? "success" : "outline"}>
                  {detailsRow.is_team_approved ? "Valide" : "En attente"}
                </Badge>
                <p className="text-sm text-muted-foreground">{detailsRow.email}</p>
                <div className="flex flex-wrap gap-2">
                  {detailsRow.niveau_academique_nom ? <Badge variant="bronze">{detailsRow.niveau_academique_nom}</Badge> : null}
                  {detailsRow.domaine_specialite ? <Badge variant="outline">{detailsRow.domaine_specialite}</Badge> : null}
                  <Badge variant="outline">Ordre {detailsRow.team_display_order || 0}</Badge>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm leading-6 text-muted-foreground">{detailsRow.mini_bio || "Mini bio non renseignée."}</p>
            </div>
            {isAdminPrincipal ? (
              <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/20 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-red-900 dark:text-red-100">
                  La suppression d’un mentor se fait depuis le détail et replace ses mentorés en attente d’assignation.
                </p>
                <Button type="button" variant="danger" onClick={() => setRowToDelete(detailsRow)}>
                  <Trash2 aria-hidden="true" />
                  Supprimer
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editingRow)}
        title={editingRow ? `Modifier ${editingRow.nom_complet}` : "Modifier l'affichage"}
        description="Mettez à jour la validation publique et l'ordre d'affichage."
        onClose={() => setEditingRow(null)}
      >
        {editingRow ? editForm(editingRow, true) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(rowToDelete)}
        title="Supprimer ce mentor"
        description="Êtes-vous sûr de vouloir supprimer ce mentor ? Ses mentorés seront conservés et replacés en attente d’assignation."
        confirmLabel="Confirmer la suppression"
        isConfirming={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setRowToDelete(null);
          }
        }}
        onConfirm={() => (rowToDelete ? handleDelete(rowToDelete) : undefined)}
      />
    </div>
  );
}
