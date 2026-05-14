"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Save, UsersRound } from "lucide-react";
import Image from "next/image";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminTeamMember,
  formatApiError,
  getAdminTeamMembers,
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
  const [drafts, setDrafts] = useState<Drafts>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [detailsRow, setDetailsRow] = useState<AdminTeamMember | null>(null);
  const [editingRow, setEditingRow] = useState<AdminTeamMember | null>(null);

  const pendingRows = useMemo(() => rows.filter((row) => !row.is_team_approved), [rows]);
  const approvedRows = useMemo(
    () =>
      rows
        .filter((row) => row.is_team_approved)
        .sort((first, second) => (first.team_display_order || 0) - (second.team_display_order || 0)),
    [rows],
  );

  useEffect(() => {
    let isMounted = true;
    getAdminTeamMembers()
      .then((teamMembers) => {
        if (isMounted) {
          setRows(teamMembers);
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
      setMessage(`Affichage public mis a jour pour ${row.nom_complet}.`);
      if (closeAfterSave) {
        setEditingRow(null);
      }
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setSavingId(null);
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
        <h1 className="font-display text-3xl font-bold">Gestion des equipes</h1>
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
                title="Demandes a traiter"
                countLabel={`${pendingRows.length} demande${pendingRows.length > 1 ? "s" : ""}`}
                minWidth={1080}
                headers={[
                  { label: "Nom" },
                  { label: "Email" },
                  { label: "Niveau" },
                  { label: "Domaine" },
                  { label: "Statut" },
                  { label: "Actions", className: "text-right" },
                ]}
              >
                {pendingRows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {avatar(row)}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{row.nom_complet}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.niveau_academique_nom || "Non renseigne"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.domaine_specialite || "Non renseigne"}</td>
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
                title="Mentors affiches"
                countLabel={`${approvedRows.length} mentor${approvedRows.length > 1 ? "s" : ""}`}
                minWidth={980}
                headers={[
                  { label: "Nom" },
                  { label: "Email" },
                  { label: "Niveau" },
                  { label: "Domaine" },
                  { label: "Ordre" },
                  { label: "Statut" },
                  { label: "Actions", className: "text-right" },
                ]}
              >
                {approvedRows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {avatar(row)}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{row.nom_complet}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.niveau_academique_nom || "Non renseigne"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.domaine_specialite || "Non renseigne"}</td>
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
                  <EmptyState icon={UsersRound} title="Aucune demande d'affichage a traiter." />
                </CardContent>
              </Card>
            ) : null}
          </div>
        )
      ) : null}

      <Modal
        open={Boolean(detailsRow)}
        title={detailsRow?.nom_complet ?? "Details du mentor"}
        description="Informations du profil public Equipes."
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
              <p className="text-sm leading-6 text-muted-foreground">{detailsRow.mini_bio || "Mini bio non renseignee."}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editingRow)}
        title={editingRow ? `Modifier ${editingRow.nom_complet}` : "Modifier l'affichage"}
        description="Mettez a jour la validation publique et l'ordre d'affichage."
        onClose={() => setEditingRow(null)}
      >
        {editingRow ? editForm(editingRow, true) : null}
      </Modal>
    </div>
  );
}
