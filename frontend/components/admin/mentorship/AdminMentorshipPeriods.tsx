"use client";

import { CalendarPlus, CheckCircle2, Pencil, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  MentorshipPeriod,
  MentorshipPeriodStatus,
  createMentorshipPeriod,
  deleteMentorshipPeriod,
  formatApiError,
  getMentorshipPeriods,
  updateMentorshipPeriod,
} from "@/lib/api";
import { formatDate, periodStatusLabels } from "@/lib/mentorship";

type PeriodDraft = {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  required_sessions: string;
  status: MentorshipPeriodStatus;
};

const emptyDraft: PeriodDraft = {
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  required_sessions: "1",
  status: "draft",
};

type AdminMentorshipPeriodsProps = {
  title?: string;
  description?: string;
  showHeader?: boolean;
};

export function AdminMentorshipPeriods({
  title = "Periodes de mentorat",
  description = "Definissez les dates et le nombre de seances attendues pour chaque periode.",
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
    getMentorshipPeriods()
      .then((periodData) => {
        if (isMounted) {
          setPeriods(periodData);
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
      description: period.description,
      start_date: period.start_date,
      end_date: period.end_date,
      required_sessions: String(period.required_sessions),
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
      description: draft.description,
      start_date: draft.start_date,
      end_date: draft.end_date,
      required_sessions: Number(draft.required_sessions),
      status: draft.status,
    };

    try {
      if (editingId !== null) {
        await updateMentorshipPeriod(editingId, payload);
        setMessage("Periode mise a jour.");
        resetForm();
      } else {
        await createMentorshipPeriod(payload);
        setMessage("Periode creee.");
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
          Date de debut
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
          Seances obligatoires
          <Input
            type="number"
            min={1}
            value={draft.required_sessions}
            onChange={(event) => setDraft({ ...draft, required_sessions: event.target.value })}
            required
          />
        </label>
        <label className="lg:col-span-2">
          Description
          <Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </label>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <Button type="submit" disabled={isSaving}>
            {isEditMode ? <Save aria-hidden="true" /> : <CalendarPlus aria-hidden="true" />}
            {isSaving ? "Enregistrement..." : isEditMode ? "Enregistrer" : "Creer la periode"}
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
      setMessage(`Periode ${periodStatusLabels[status].toLowerCase()}.`);
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
      setMessage("Periode supprimee.");
      await loadPeriods();
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  return (
    <div className="grid gap-5">
      {showHeader ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <Button type="button" className="w-fit" onClick={openCreateModal}>
            <CalendarPlus aria-hidden="true" />
            Creer une periode
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button type="button" className="w-fit" onClick={openCreateModal}>
            <CalendarPlus aria-hidden="true" />
            Creer une periode
          </Button>
        </div>
      )}

      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      <Modal
        open={isCreateOpen}
        title="Creer une periode de mentorat"
        description="Definissez les dates, le statut et le nombre de seances obligatoires."
        onClose={closeCreateModal}
      >
        {renderPeriodForm("create")}
      </Modal>

      {editingId !== null ? (
        <Card>
          <CardHeader>
            <CardTitle>Modifier une periode</CardTitle>
          </CardHeader>
          <CardContent>{renderPeriodForm("edit")}</CardContent>
        </Card>
      ) : null}

      {isLoading ? <Skeleton className="h-64" /> : null}

      <div className="grid gap-3">
        {periods.map((period) => (
          <Card key={period.id}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{period.title}</h2>
                    <Badge variant={period.status === "active" ? "success" : "outline"}>{periodStatusLabels[period.status]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(period.start_date)} - {formatDate(period.end_date)} | {period.required_sessions} seance
                    {period.required_sessions > 1 ? "s" : ""}
                  </p>
                  {period.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{period.description}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => editPeriod(period)}>
                    <Pencil aria-hidden="true" />
                    Modifier
                  </Button>
                  {period.status !== "active" ? (
                    <Button type="button" variant="secondary" size="sm" onClick={() => void changeStatus(period, "active")}>
                      <CheckCircle2 aria-hidden="true" />
                      Activer
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" size="sm" onClick={() => void changeStatus(period, "completed")}>
                      <CheckCircle2 aria-hidden="true" />
                      Terminer
                    </Button>
                  )}
                  <Button type="button" variant="danger" size="sm" onClick={() => void removePeriod(period)}>
                    <Trash2 aria-hidden="true" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
