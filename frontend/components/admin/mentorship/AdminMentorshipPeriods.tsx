"use client";

import { CalendarPlus, CheckCircle2, Eye, FileSpreadsheet, FileText, Pencil, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MentorshipPeriod,
  MentorshipPeriodStatus,
  createMentorshipPeriod,
  deleteMentorshipPeriod,
  exportMentorshipPeriod,
  formatApiError,
  getCurrentUser,
  getMentorshipPeriods,
  updateMentorshipPeriod,
  UtilisateurDetail,
} from "@/lib/api";
import { formatDate, periodStatusLabels } from "@/lib/mentorship";

type PeriodDraft = {
  title: string;
  start_date: string;
  end_date: string;
  required_sessions: string;
  max_mentees_per_mentor: string;
  status: MentorshipPeriodStatus;
};

const emptyDraft: PeriodDraft = {
  title: "",
  start_date: "",
  end_date: "",
  required_sessions: "1",
  max_mentees_per_mentor: "5",
  status: "draft",
};

type AdminMentorshipPeriodsProps = {
  title?: string;
  description?: string;
  showHeader?: boolean;
};

export function AdminMentorshipPeriods({
  title = "Périodes de mentorat",
  description = "Définissez les dates et le nombre de séances attendues pour chaque période.",
  showHeader = true,
}: AdminMentorshipPeriodsProps) {
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [draft, setDraft] = useState<PeriodDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UtilisateurDetail | null>(null);
  const [detailsPeriod, setDetailsPeriod] = useState<MentorshipPeriod | null>(null);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const canManagePeriods = currentUser?.role_nom === "ADMIN_PRINCIPAL";
  const canExportPeriods = currentUser?.role_nom === "ADMIN_PRINCIPAL";
  const exportRecommendedPeriods = periods.filter((period) => isExportRecommended(period));

  async function loadPeriods() {
    try {
      setPeriods(await getMentorshipPeriods());
      setError("");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    Promise.all([getMentorshipPeriods(), getCurrentUser()])
      .then(([periodData, user]) => {
        if (isMounted) {
          setPeriods(periodData);
          setCurrentUser(user);
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

  function editPeriod(period: MentorshipPeriod) {
    setIsCreateOpen(false);
    setEditingId(period.id);
    setDraft({
      title: period.title,
      start_date: period.start_date,
      end_date: period.end_date,
      required_sessions: String(period.required_sessions),
      max_mentees_per_mentor: String(period.max_mentees_per_mentor ?? 5),
      status: period.status,
    });
    setMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  function openCreateModal() {
    setEditingId(null);
    setDraft(emptyDraft);
    setMessage("");
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    setIsCreateOpen(false);
    setDraft(emptyDraft);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    const payload = {
      title: draft.title,
      start_date: draft.start_date,
      end_date: draft.end_date,
      required_sessions: Number(draft.required_sessions),
      max_mentees_per_mentor: Number(draft.max_mentees_per_mentor),
      status: draft.status,
    };

    try {
      if (editingId !== null) {
        await updateMentorshipPeriod(editingId, payload);
        setMessage("Période mise à jour.");
        resetForm();
      } else {
        await createMentorshipPeriod({ ...payload, description: "" });
        setMessage("Période créée.");
        setDraft(emptyDraft);
        setIsCreateOpen(false);
      }
      await loadPeriods();
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  function renderPeriodForm(mode: "create" | "edit") {
    const isEditMode = mode === "edit";

    return (
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        <label>
          Titre
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
        </label>
        <label>
          Statut
          <select
            className="field"
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as MentorshipPeriodStatus })}
          >
            {Object.entries(periodStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date de début
          <Input
            type="date"
            value={draft.start_date}
            onChange={(event) => setDraft({ ...draft, start_date: event.target.value })}
            required
          />
        </label>
        <label>
          Date de fin
          <Input
            type="date"
            value={draft.end_date}
            onChange={(event) => setDraft({ ...draft, end_date: event.target.value })}
            required
          />
        </label>
        <label>
          Séances obligatoires
          <Input
            type="number"
            min={1}
            value={draft.required_sessions}
            onChange={(event) => setDraft({ ...draft, required_sessions: event.target.value })}
            required
          />
        </label>
        <label>
          Nombre maximal de mentorés par mentor
          <Input
            type="number"
            min={1}
            value={draft.max_mentees_per_mentor}
            onChange={(event) => setDraft({ ...draft, max_mentees_per_mentor: event.target.value })}
            required
          />
        </label>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <Button type="submit" disabled={isSaving}>
            {isEditMode ? <Save aria-hidden="true" /> : <CalendarPlus aria-hidden="true" />}
            {isSaving ? "Enregistrement..." : isEditMode ? "Enregistrer" : "Créer la période"}
          </Button>
          {isEditMode ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Annuler
            </Button>
          ) : null}
        </div>
      </form>
    );
  }

  async function changeStatus(period: MentorshipPeriod, status: MentorshipPeriodStatus) {
    setError("");
    setMessage("");
    try {
      await updateMentorshipPeriod(period.id, { status });
      setMessage(`Période ${periodStatusLabels[status].toLowerCase()}.`);
      await loadPeriods();
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  async function removePeriod(period: MentorshipPeriod) {
    setError("");
    setMessage("");
    try {
      await deleteMentorshipPeriod(period.id);
      setMessage("Période supprimée.");
      await loadPeriods();
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  async function handleExport(period: MentorshipPeriod, format: "excel" | "csv") {
    const key = `${period.id}-${format}`;
    setExportingKey(key);
    setError("");
    setMessage("");
    try {
      const { blob, filename } = await exportMentorshipPeriod(period.id, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage(`Téléchargement ${format === "excel" ? "Excel" : "CSV"} lancé pour ${period.title}.`);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setExportingKey(null);
    }
  }

  return (
    <div className="grid gap-5">
      {showHeader ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-bold">{title}</h1>
              <HelpIconButton moduleKey="periods" scope="admin" />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          {canManagePeriods ? (
            <Button type="button" className="w-fit" onClick={openCreateModal}>
              <CalendarPlus aria-hidden="true" />
              Créer une période
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex justify-end">
          {canManagePeriods ? (
            <Button type="button" className="w-fit" onClick={openCreateModal}>
              <CalendarPlus aria-hidden="true" />
              Créer une période
            </Button>
          ) : null}
        </div>
      )}

      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}
      {!isLoading && canExportPeriods && exportRecommendedPeriods.length > 0 ? (
        <Alert variant="warning">
          {exportRecommendedPeriods.length === 1
            ? `La période ${exportRecommendedPeriods[0].title} est terminée ou archivée. Pensez à exporter et archiver les données.`
            : `${exportRecommendedPeriods.length} périodes sont terminées ou archivées. Pensez à exporter les données pour conservation administrative.`}
        </Alert>
      ) : null}

      <Modal
        open={isCreateOpen}
        title="Créer une période de mentorat"
        description="Définissez les dates, le statut, le nombre de séances et la limite de mentorés par mentor."
        onClose={closeCreateModal}
      >
        {renderPeriodForm("create")}
      </Modal>

      {editingId !== null ? (
        <Card>
          <CardHeader>
            <CardTitle>Modifier une période</CardTitle>
          </CardHeader>
          <CardContent>{renderPeriodForm("edit")}</CardContent>
        </Card>
      ) : null}

      {isLoading ? <Skeleton className="h-64" /> : null}

      {!isLoading ? (
        <ListTable
          title="Liste des périodes"
          countLabel={`${periods.length} période${periods.length > 1 ? "s" : ""}`}
          minWidth={1040}
          headers={[
            { label: "Titre" },
            { label: "Début" },
            { label: "Fin" },
            { label: "Statut" },
            { label: "Actions", className: "text-right" },
          ]}
          emptyState={periods.length === 0 ? <EmptyState icon={CalendarPlus} title="Aucune période pour le moment." /> : null}
        >
          {periods.map((period) => (
            <tr key={period.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{period.title}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(period.start_date)}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(period.end_date)}</td>
              <td className="px-4 py-3">
                <Badge variant={period.status === "active" ? "success" : "outline"}>{periodStatusLabels[period.status]}</Badge>
                {isExportRecommended(period) ? (
                  <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-200">Export recommandé</p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDetailsPeriod(period)}>
                    <Eye aria-hidden="true" />
                    Détails
                  </Button>
                  {canExportPeriods ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={exportingKey === `${period.id}-excel`}
                        onClick={() => void handleExport(period, "excel")}
                      >
                        <FileSpreadsheet aria-hidden="true" />
                        {exportingKey === `${period.id}-excel` ? "Export..." : "Export Excel"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={exportingKey === `${period.id}-csv`}
                        onClick={() => void handleExport(period, "csv")}
                      >
                        <FileText aria-hidden="true" />
                        {exportingKey === `${period.id}-csv` ? "Export..." : "Export CSV"}
                      </Button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </ListTable>
      ) : null}

      <Modal
        open={Boolean(detailsPeriod)}
        title="Détails de la période"
        description="Informations complètes de la période sélectionnée."
        className="max-w-3xl"
        onClose={() => setDetailsPeriod(null)}
      >
        {detailsPeriod ? (
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
            <DetailItem label="Titre" value={detailsPeriod.title} />
            <DetailItem label="Statut" value={periodStatusLabels[detailsPeriod.status]} />
            <DetailItem label="Date de début" value={formatDate(detailsPeriod.start_date)} />
            <DetailItem label="Date de fin" value={formatDate(detailsPeriod.end_date)} />
            <DetailItem
              label="Séances obligatoires"
              value={`${detailsPeriod.required_sessions} séance${detailsPeriod.required_sessions > 1 ? "s" : ""}`}
            />
            <DetailItem
              label="Maximum de mentorés par mentor"
              value={`${detailsPeriod.max_mentees_per_mentor} mentoré${detailsPeriod.max_mentees_per_mentor > 1 ? "s" : ""}`}
            />
            <DetailItem label="Description" value={detailsPeriod.description || "Non renseignée"} className="md:col-span-2" />
            {isExportRecommended(detailsPeriod) ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100 md:col-span-2">
                Cette période est terminée ou archivée. Pensez à exporter les données pour les rapports et la
                conservation historique.
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 md:col-span-2">
              {canExportPeriods ? (
                <>
                  <Button type="button" variant="outline" onClick={() => void handleExport(detailsPeriod, "excel")}>
                    <FileSpreadsheet aria-hidden="true" />
                    Export Excel
                  </Button>
                  <Button type="button" variant="outline" onClick={() => void handleExport(detailsPeriod, "csv")}>
                    <FileText aria-hidden="true" />
                    Export CSV
                  </Button>
                </>
              ) : null}
              {canManagePeriods ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDetailsPeriod(null);
                      editPeriod(detailsPeriod);
                    }}
                  >
                    <Pencil aria-hidden="true" />
                    Modifier
                  </Button>
                  {detailsPeriod.status !== "active" ? (
                    <Button type="button" variant="secondary" onClick={() => void changeStatus(detailsPeriod, "active")}>
                      <CheckCircle2 aria-hidden="true" />
                      Activer
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" onClick={() => void changeStatus(detailsPeriod, "completed")}>
                      <CheckCircle2 aria-hidden="true" />
                      Terminer
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setDetailsPeriod(null);
                      void removePeriod(detailsPeriod);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                    Supprimer
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function isExportRecommended(period: MentorshipPeriod) {
  if (period.status === "completed" || period.status === "archived") {
    return true;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(`${period.end_date}T00:00:00`);
  return endDate < today;
}

function DetailItem({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
