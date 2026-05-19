"use client";

import { CheckCircle2, ClipboardCheck, Eye, Pencil, TrendingUp } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { usePagination } from "@/hooks/usePagination";
import {
  MentoreeProgress,
  MentoreeProgressStatus,
  MentorshipAssignment,
  MentorshipSession,
  formatApiError,
  getMentorAssignmentProgress,
  getMentorAssignments,
  getMentorFollowUps,
  updateMentorFollowUp,
} from "@/lib/api";
import { displayUser, formatDate, normalizeTime, progressStatusLabels, sessionStatusLabels } from "@/lib/mentorship";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

const appreciationOptions: MentoreeProgressStatus[] = ["excellent", "good", "average", "watch", "difficulty"];

export function MentorFollowUpsPanel() {
  const [assignments, setAssignments] = useState<MentorshipAssignment[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [progressByAssignment, setProgressByAssignment] = useState<Record<number, MentoreeProgress>>({});
  const [detailSession, setDetailSession] = useState<MentorshipSession | null>(null);
  const [updateSession, setUpdateSession] = useState<MentorshipSession | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const assignmentsById = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.id, assignment])),
    [assignments],
  );
  const { page, setPage, pageCount, visibleItems: visibleSessions } = usePagination(sessions, 8);

  const loadData = useCallback(async () => {
    try {
      const [assignmentRows, sessionRows] = await Promise.all([getMentorAssignments(), getMentorFollowUps()]);
      const progressRows = await Promise.all(
        assignmentRows.map(async (assignment) => [assignment.id, await getMentorAssignmentProgress(assignment.id)] as const),
      );
      setAssignments(assignmentRows);
      setSessions(sessionRows);
      setProgressByAssignment(Object.fromEntries(progressRows));
      setError("");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getMentorAssignments(), getMentorFollowUps()])
      .then(async ([assignmentRows, sessionRows]) => {
        const progressRows = await Promise.all(
          assignmentRows.map(async (assignment) => [assignment.id, await getMentorAssignmentProgress(assignment.id)] as const),
        );
        if (isMounted) {
          setAssignments(assignmentRows);
          setSessions(sessionRows);
          setProgressByAssignment(Object.fromEntries(progressRows));
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

  function getAssignment(session: MentorshipSession | null) {
    return session ? assignmentsById.get(session.assignment) : undefined;
  }

  function getProgress(session: MentorshipSession | null) {
    return session ? progressByAssignment[session.assignment] : undefined;
  }

  function generatedPercentage(assignment?: MentorshipAssignment) {
    if (!assignment?.required_sessions) {
      return 0;
    }
    return Math.min(Math.floor((assignment.completed_sessions_count / assignment.required_sessions) * 100), 100);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!updateSession) {
      setFormError("Sélectionnez une séance.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const progressStatus = formString(formData, "progress_status") as MentoreeProgressStatus;
    if (!progressStatus) {
      setFormError("Choisissez une appréciation.");
      return;
    }

    setFormError("");
    setMessage("");
    setIsSaving(true);
    try {
      const assignment = getAssignment(updateSession);
      await updateMentorFollowUp(updateSession.id, {
        progress_status: progressStatus,
        appreciation: progressStatusLabels[progressStatus],
        observation: formString(formData, "observation"),
        recommendations: formString(formData, "recommendations"),
        summary: updateSession.summary,
      });
      setMessage(`Suivi mis à jour. Avancement automatique : ${generatedPercentage(assignment)}%.`);
      setUpdateSession(null);
      await loadData();
    } catch (apiError) {
      setFormError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  function renderDetails(session: MentorshipSession) {
    const assignment = getAssignment(session);
    const progress = getProgress(session);
    const status = progress?.progress_status ?? assignment?.progress_status ?? "average";
    return (
      <div className="grid gap-5">
        <div className="grid gap-3 rounded-lg border border-border bg-muted/25 p-4 text-sm md:grid-cols-2">
          <p>
            <span className="block text-muted-foreground">Mentoré</span>
            <span className="font-semibold">{displayUser(session.mentoree_detail ?? assignment?.mentoree_detail)}</span>
          </p>
          <p>
            <span className="block text-muted-foreground">Statut</span>
            <span className="font-semibold">{sessionStatusLabels[session.status]}</span>
          </p>
          <p>
            <span className="block text-muted-foreground">Date</span>
            <span className="font-semibold">{formatDate(session.scheduled_date)}</span>
          </p>
          <p>
            <span className="block text-muted-foreground">Horaire</span>
            <span className="font-semibold">
              {normalizeTime(session.start_time) || "Non renseigné"}
              {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
            </span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Objet / résumé</span>
            <span className="font-semibold">{session.summary || "Non renseigné"}</span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Commentaire de séance</span>
            <span className="font-semibold">{session.mentor_comment || "Aucun commentaire"}</span>
          </p>
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm md:grid-cols-2">
          <p>
            <span className="block text-muted-foreground">Appréciation</span>
            <span className="font-semibold">{progressStatusLabels[status]}</span>
          </p>
          <p>
            <span className="block text-muted-foreground">Avancement automatique</span>
            <span className="font-semibold">{generatedPercentage(assignment)}%</span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Observations</span>
            <span className="font-semibold">{progress?.achievements || "Non renseignées"}</span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Recommandations</span>
            <span className="font-semibold">{progress?.recommendations || "Non renseignées"}</span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Avis général</span>
            <span className="font-semibold">{progress?.mentor_opinion || "Non renseigné"}</span>
          </p>
        </div>
      </div>
    );
  }

  function renderUpdateForm(session: MentorshipSession) {
    const assignment = getAssignment(session);
    const progress = getProgress(session);
    return (
      <form key={session.id} onSubmit={handleSubmit} className="grid gap-4">
        <div className="rounded-lg border border-border bg-muted/25 p-4 text-sm">
          <p className="font-semibold">{displayUser(session.mentoree_detail ?? assignment?.mentoree_detail)}</p>
          <p className="mt-1 text-muted-foreground">
            {assignment?.completed_sessions_count ?? 0} séance{(assignment?.completed_sessions_count ?? 0) > 1 ? "s" : ""} achevée
            {(assignment?.completed_sessions_count ?? 0) > 1 ? "s" : ""} sur {assignment?.required_sessions ?? 0}
          </p>
          <div className="mt-3 flex items-center gap-2 text-primary">
            <TrendingUp className="size-4" aria-hidden="true" />
            <span className="font-semibold">Avancement automatique : {generatedPercentage(assignment)}%</span>
          </div>
        </div>

        <label>
          Appréciation
          <select name="progress_status" className="field" defaultValue={progress?.progress_status ?? assignment?.progress_status ?? "average"} required>
            {appreciationOptions.map((value) => (
              <option key={value} value={value}>
                {progressStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Observation optionnelle
          <Textarea name="observation" defaultValue={progress?.achievements || session.mentor_comment} />
        </label>
        <label>
          Recommandation optionnelle
          <Textarea name="recommendations" defaultValue={progress?.recommendations ?? ""} />
        </label>
        {formError ? <Alert variant="error">{formError}</Alert> : null}
        <Button type="submit" className="w-fit" disabled={isSaving}>
          <CheckCircle2 aria-hidden="true" />
          {isSaving ? "Enregistrement..." : "Enregistrer le suivi"}
        </Button>
      </form>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (sessions.length === 0) {
    return <EmptyState icon={ClipboardCheck} title="Aucune séance achevée à suivre." />;
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-lg font-semibold">Séances achevées</h2>
        <p className="text-sm text-muted-foreground">
          {sessions.length} séance{sessions.length > 1 ? "s" : ""} réalisée{sessions.length > 1 ? "s" : ""}.
        </p>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}

      <Modal open={Boolean(detailSession)} title="Détails du suivi" onClose={() => setDetailSession(null)}>
        {detailSession ? renderDetails(detailSession) : null}
      </Modal>

      <Modal open={Boolean(updateSession)} title="Mise à jour du suivi" onClose={() => setUpdateSession(null)}>
        {updateSession ? renderUpdateForm(updateSession) : null}
      </Modal>

      <ListTable
        title="Liste des séances achevées"
        countLabel={`${sessions.length} séance${sessions.length > 1 ? "s" : ""}`}
        minWidth={1080}
        footer={pageCount > 1 ? <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} /> : null}
        headers={[
          { label: "Mentoré" },
          { label: "Séance" },
          { label: "Objet" },
          { label: "Avancement" },
          { label: "Statut" },
          { label: "Actions", className: "text-right" },
        ]}
      >
        {visibleSessions.map((session) => {
          const assignment = getAssignment(session);
          const progress = getProgress(session);
          const progressStatus = progress?.progress_status ?? assignment?.progress_status ?? "average";
          return (
            <tr key={session.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{displayUser(session.mentoree_detail ?? assignment?.mentoree_detail)}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <p className="font-medium text-foreground">Séance {session.session_number}</p>
                <p className="mt-1 text-xs">
                  {formatDate(session.scheduled_date)} | {normalizeTime(session.start_time) || "Heure non renseignée"}
                  {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <p className="line-clamp-2 max-w-sm">{session.summary || "Non renseigné"}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <p>{generatedPercentage(assignment)}%</p>
                <p className="mt-1 text-xs">{progressStatusLabels[progressStatus]}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant="success">{sessionStatusLabels[session.status]}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDetailSession(session)}>
                    <Eye aria-hidden="true" />
                    Détails
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setUpdateSession(session)}>
                    <Pencil aria-hidden="true" />
                    Mise à jour
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </ListTable>
    </div>
  );
}
