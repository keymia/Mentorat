"use client";

import { CalendarPlus, CheckCircle2, Save, TrendingUp } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  MentorMenteeDetail,
  MentoreeProgressStatus,
  MentorshipPeriod,
  MentorshipSession,
  MentorshipSessionStatus,
  completeMentorSession,
  continueMentorAssignment,
  createMentorAssignmentSession,
  formatApiError,
  getAvailableMentorshipPeriods,
  getMentorMenteeDetail,
  updateMentorAssignmentProgress,
  updateMentorSession,
} from "@/lib/api";
import {
  displayUser,
  formatDate,
  normalizeTime,
  progressStatusLabels,
  sessionStatusLabels,
} from "@/lib/mentorship";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function nullableTime(value: string) {
  return value ? value : null;
}

export function MentorMenteeWorkspace({ menteeId }: { menteeId: number }) {
  const [detail, setDetail] = useState<MentorMenteeDetail | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<MentorshipPeriod[]>([]);
  const [renewalPeriodId, setRenewalPeriodId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setDetail(await getMentorMenteeDetail(menteeId));
      setError("");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsLoading(false);
    }
  }, [menteeId]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getMentorMenteeDetail(menteeId), getAvailableMentorshipPeriods()])
      .then(([data, periods]) => {
        if (isMounted) {
          setDetail(data);
          setAvailablePeriods(periods);
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
  }, [menteeId]);

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) {
      return;
    }
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    setError("");
    setMessage("");
    try {
      await createMentorAssignmentSession(detail.current_assignment.id, {
        session_number: Number(formString(formData, "session_number")),
        scheduled_date: formString(formData, "scheduled_date"),
        start_time: nullableTime(formString(formData, "start_time")),
        end_time: nullableTime(formString(formData, "end_time")),
        status: "scheduled",
        summary: formString(formData, "summary"),
        mentor_comment: formString(formData, "mentor_comment"),
      });
      formElement.reset();
      setIsCreateSessionOpen(false);
      setMessage("Seance programmee.");
      await loadDetail();
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  function openCreateSessionModal() {
    setMessage("");
    setIsCreateSessionOpen(true);
  }

  function closeCreateSessionModal() {
    setIsCreateSessionOpen(false);
  }

  async function handleSessionSubmit(event: FormEvent<HTMLFormElement>, session: MentorshipSession) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const payload = {
      session_number: Number(formString(formData, "session_number")),
      scheduled_date: formString(formData, "scheduled_date"),
      start_time: nullableTime(formString(formData, "start_time")),
      end_time: nullableTime(formString(formData, "end_time")),
      status: formString(formData, "status") as MentorshipSessionStatus,
      summary: formString(formData, "summary"),
      mentor_comment: formString(formData, "mentor_comment"),
    };

    setError("");
    setMessage("");
    try {
      if (submitter?.name === "complete") {
        await completeMentorSession(session.id, payload);
        setMessage("Seance marquee comme realisee.");
      } else {
        await updateMentorSession(session.id, payload);
        setMessage("Seance mise a jour.");
      }
      await loadDetail();
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  async function handleProgressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const percentage = formString(formData, "progress_percentage");
    setError("");
    setMessage("");
    try {
      await updateMentorAssignmentProgress(detail.current_assignment.id, {
        progress_status: formString(formData, "progress_status") as MentoreeProgressStatus,
        progress_percentage: percentage ? Number(percentage) : null,
        difficulties: formString(formData, "difficulties"),
        achievements: formString(formData, "achievements"),
        recommendations: formString(formData, "recommendations"),
        mentor_opinion: formString(formData, "mentor_opinion"),
      });
      setMessage("Suivi mis a jour.");
      await loadDetail();
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  async function handleRenewalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || !renewalPeriodId) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await continueMentorAssignment(detail.current_assignment.id, Number(renewalPeriodId));
      setRenewalPeriodId("");
      setMessage("Affectation reconduite pour la nouvelle periode.");
      await loadDetail();
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  if (isLoading && !detail) {
    return <Skeleton className="h-96" />;
  }

  if (error && !detail) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!detail) {
    return null;
  }

  const assignment = detail.current_assignment;
  const progress = detail.progress;
  const renewalPeriods = availablePeriods.filter(
    (period) => period.id !== assignment.period && period.start_date > (assignment.period_detail?.start_date ?? ""),
  );

  function renderCreateSessionForm() {
    return (
      <form onSubmit={handleCreateSession} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label>
          Numero
          <Input name="session_number" type="number" min={1} max={assignment.required_sessions} required />
        </label>
        <label>
          Date
          <Input name="scheduled_date" type="date" required />
        </label>
        <label>
          Debut
          <Input name="start_time" type="time" />
        </label>
        <label>
          Fin
          <Input name="end_time" type="time" />
        </label>
        <label className="md:col-span-2">
          Resume
          <Textarea name="summary" />
        </label>
        <label className="md:col-span-2">
          Commentaire
          <Textarea name="mentor_comment" />
        </label>
        <Button type="submit" className="w-fit">
          <CalendarPlus aria-hidden="true" />
          Creer la seance
        </Button>
      </form>
    );
  }

  return (
    <div className="grid gap-6">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      <Modal
        open={isCreateSessionOpen}
        title="Creer une seance"
        description="Planifiez la date, l'horaire et les premiers commentaires de suivi."
        onClose={closeCreateSessionModal}
      >
        {renderCreateSessionForm()}
      </Modal>

      <Card>
        <CardContent className="grid gap-4 p-5 xl:grid-cols-[1.1fr_1fr_auto] xl:items-start">
          <div>
            <h2 className="text-2xl font-semibold">{displayUser(detail.mentee)}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {assignment.period_detail?.title ?? "Periode"} | {formatDate(assignment.period_detail?.start_date)} -{" "}
              {formatDate(assignment.period_detail?.end_date)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:text-right">
            <p>
              <span className="block font-semibold text-foreground">{assignment.required_sessions ?? 0}</span>
              Obligatoires
            </p>
            <p>
              <span className="block font-semibold text-foreground">{assignment.scheduled_sessions_count}</span>
              Programmees
            </p>
            <p>
              <span className="block font-semibold text-foreground">{assignment.completed_sessions_count}</span>
              Realisees
            </p>
            <p>
              <span className="block font-semibold text-foreground">{assignment.remaining_sessions_count}</span>
              Restantes
            </p>
          </div>
          <div className="flex xl:justify-end">
            <Button type="button" className="w-fit" onClick={openCreateSessionModal}>
              <CalendarPlus aria-hidden="true" />
              Creer une seance
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seances</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {detail.sessions.map((session) => (
            <form key={session.id} onSubmit={(event) => void handleSessionSubmit(event, session)} className="rounded-lg border border-border bg-muted/25 p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant={session.status === "completed" ? "success" : "outline"}>
                  {sessionStatusLabels[session.status]}
                </Badge>
                <span className="text-sm font-semibold">Seance {session.session_number}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label>
                  Numero
                  <Input name="session_number" type="number" min={1} defaultValue={session.session_number} required />
                </label>
                <label>
                  Date
                  <Input name="scheduled_date" type="date" defaultValue={session.scheduled_date} required />
                </label>
                <label>
                  Debut
                  <Input name="start_time" type="time" defaultValue={normalizeTime(session.start_time)} />
                </label>
                <label>
                  Fin
                  <Input name="end_time" type="time" defaultValue={normalizeTime(session.end_time)} />
                </label>
                <label>
                  Statut
                  <select name="status" className="field" defaultValue={session.status}>
                    {Object.entries(sessionStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="md:col-span-2 xl:col-span-5">
                  Resume
                  <Textarea name="summary" defaultValue={session.summary} />
                </label>
                <label className="md:col-span-2 xl:col-span-5">
                  Commentaire
                  <Textarea name="mentor_comment" defaultValue={session.mentor_comment} />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit" variant="outline" size="sm" name="save">
                  <Save aria-hidden="true" />
                  Enregistrer
                </Button>
                <Button type="submit" variant="secondary" size="sm" name="complete">
                  <CheckCircle2 aria-hidden="true" />
                  Realisee
                </Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avancement du mentore</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProgressSubmit} className="grid gap-4 md:grid-cols-2">
            <label>
              Statut
              <select name="progress_status" className="field" defaultValue={progress?.progress_status ?? "average"}>
                {Object.entries(progressStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pourcentage
              <Input name="progress_percentage" type="number" min={0} max={100} defaultValue={progress?.progress_percentage ?? ""} />
            </label>
            <label>
              Progres observes
              <Textarea name="achievements" defaultValue={progress?.achievements ?? ""} />
            </label>
            <label>
              Difficultes
              <Textarea name="difficulties" defaultValue={progress?.difficulties ?? ""} />
            </label>
            <label>
              Recommandations
              <Textarea name="recommendations" defaultValue={progress?.recommendations ?? ""} />
            </label>
            <label>
              Avis general
              <Textarea name="mentor_opinion" defaultValue={progress?.mentor_opinion ?? ""} />
            </label>
            <Button type="submit" className="w-fit">
              <TrendingUp aria-hidden="true" />
              Mettre a jour
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Continuer avec une nouvelle periode</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRenewalSubmit} className="grid gap-4 md:grid-cols-[1fr_auto]">
            <label>
              Nouvelle periode definie par l&apos;administration
              <select
                className="field"
                value={renewalPeriodId}
                onChange={(event) => setRenewalPeriodId(event.target.value)}
                disabled={renewalPeriods.length === 0}
              >
                <option value="">Choisir une periode</option>
                {renewalPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.title} - {formatDate(period.start_date)} au {formatDate(period.end_date)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button type="submit" disabled={!renewalPeriodId}>
                Reconduire
              </Button>
            </div>
          </form>
          {renewalPeriods.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Aucune nouvelle periode disponible pour le moment.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
