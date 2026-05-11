"use client";

import { CheckCircle2, ClipboardCheck, Eye, Pencil, TrendingUp } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
      setFormError("Selectionnez une seance.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const progressStatus = formString(formData, "progress_status") as MentoreeProgressStatus;
    if (!progressStatus) {
      setFormError("Choisissez une appreciation.");
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
      setMessage(`Suivi mis a jour. Avancement automatique: ${generatedPercentage(assignment)}%.`);
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
            <span className="block text-muted-foreground">Mentore</span>
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
              {normalizeTime(session.start_time) || "Non renseigne"}
              {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
            </span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Objet / resume</span>
            <span className="font-semibold">{session.summary || "Non renseigne"}</span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Commentaire de seance</span>
            <span className="font-semibold">{session.mentor_comment || "Aucun commentaire"}</span>
          </p>
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm md:grid-cols-2">
          <p>
            <span className="block text-muted-foreground">Appreciation</span>
            <span className="font-semibold">{progressStatusLabels[status]}</span>
          </p>
          <p>
            <span className="block text-muted-foreground">Avancement automatique</span>
            <span className="font-semibold">{generatedPercentage(assignment)}%</span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Observations</span>
            <span className="font-semibold">{progress?.achievements || "Non renseignees"}</span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Recommandations</span>
            <span className="font-semibold">{progress?.recommendations || "Non renseignees"}</span>
          </p>
          <p className="md:col-span-2">
            <span className="block text-muted-foreground">Avis general</span>
            <span className="font-semibold">{progress?.mentor_opinion || "Non renseigne"}</span>
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
            {assignment?.completed_sessions_count ?? 0} seance{(assignment?.completed_sessions_count ?? 0) > 1 ? "s" : ""} achevee
            {(assignment?.completed_sessions_count ?? 0) > 1 ? "s" : ""} sur {assignment?.required_sessions ?? 0}
          </p>
          <div className="mt-3 flex items-center gap-2 text-primary">
            <TrendingUp className="size-4" aria-hidden="true" />
            <span className="font-semibold">Avancement automatique: {generatedPercentage(assignment)}%</span>
          </div>
        </div>

        <label>
          Appreciation
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
    return <EmptyState icon={ClipboardCheck} title="Aucune seance achevee a suivre." />;
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-lg font-semibold">Seances achevees</h2>
        <p className="text-sm text-muted-foreground">
          {sessions.length} seance{sessions.length > 1 ? "s" : ""} realisee{sessions.length > 1 ? "s" : ""}.
        </p>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}

      <Modal open={Boolean(detailSession)} title="Details du suivi" onClose={() => setDetailSession(null)}>
        {detailSession ? renderDetails(detailSession) : null}
      </Modal>

      <Modal open={Boolean(updateSession)} title="Mise a jour du suivi" onClose={() => setUpdateSession(null)}>
        {updateSession ? renderUpdateForm(updateSession) : null}
      </Modal>

      <div className="grid gap-3">
        {sessions.map((session) => {
          const assignment = getAssignment(session);
          const progress = getProgress(session);
          const progressStatus = progress?.progress_status ?? assignment?.progress_status ?? "average";
          return (
            <Card key={session.id}>
              <CardContent className="grid gap-4 p-5 xl:grid-cols-[1.25fr_1fr_auto] xl:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{displayUser(session.mentoree_detail ?? assignment?.mentoree_detail)}</h3>
                    <Badge variant="success">{sessionStatusLabels[session.status]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Seance {session.session_number} | {formatDate(session.scheduled_date)} |{" "}
                    {normalizeTime(session.start_time) || "Heure non renseignee"}
                    {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Objet: {session.summary || "Non renseigne"}</p>
                </div>
                <div className="grid gap-1 text-sm text-muted-foreground">
                  <p>{progressStatusLabels[progressStatus]}</p>
                  <p>{generatedPercentage(assignment)}% d&apos;avancement</p>
                </div>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDetailSession(session)}>
                    <Eye aria-hidden="true" />
                    Details
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setUpdateSession(session)}>
                    <Pencil aria-hidden="true" />
                    Mise a jour
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
