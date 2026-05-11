"use client";

import { CalendarPlus, Eye } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  MentorMenteeDetail,
  MentorshipSession,
  createMentorAssignmentSession,
  formatApiError,
  getMentorMenteeDetail,
} from "@/lib/api";
import {
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

function displayName(user: MentorMenteeDetail["mentee"]) {
  const name = `${user.prenom ?? ""} ${user.nom ?? ""}`.trim();
  return name || "Mentore non renseigne";
}

export function MentorMenteeWorkspace({ menteeId }: { menteeId: number }) {
  const [detail, setDetail] = useState<MentorMenteeDetail | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [selectedFollowUpSession, setSelectedFollowUpSession] = useState<MentorshipSession | null>(null);

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
    getMentorMenteeDetail(menteeId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
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
  const progressStatus = progress?.progress_status ?? assignment.progress_status ?? "average";
  const progressPercentage = progress?.progress_percentage ?? assignment.progress_percentage ?? 0;

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

  function getSessionProgressPercentage(session: MentorshipSession) {
    const requiredSessions = assignment.required_sessions || 0;
    if (!requiredSessions) {
      return progressPercentage;
    }
    return Math.min(Math.round((session.session_number / requiredSessions) * 100), 100);
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

      <Modal
        open={Boolean(selectedFollowUpSession)}
        title={selectedFollowUpSession ? `Suivi - Seance ${selectedFollowUpSession.session_number}` : "Suivi de seance"}
        description="Informations de la seance et details du suivi lorsque la rencontre est realisee."
        onClose={() => setSelectedFollowUpSession(null)}
      >
        {selectedFollowUpSession ? (
          <div className="grid gap-5">
            <div className="grid gap-3 rounded-lg border border-border bg-muted/25 p-4 text-sm md:grid-cols-2">
              <p>
                <span className="block text-muted-foreground">Statut de la seance</span>
                <span className="font-semibold text-foreground">{sessionStatusLabels[selectedFollowUpSession.status]}</span>
              </p>
              <p>
                <span className="block text-muted-foreground">Date</span>
                <span className="font-semibold text-foreground">{formatDate(selectedFollowUpSession.scheduled_date)}</span>
              </p>
              <p>
                <span className="block text-muted-foreground">Heure de debut</span>
                <span className="font-semibold text-foreground">
                  {normalizeTime(selectedFollowUpSession.start_time) || "Non renseignee"}
                </span>
              </p>
              <p>
                <span className="block text-muted-foreground">Heure de fin</span>
                <span className="font-semibold text-foreground">
                  {normalizeTime(selectedFollowUpSession.end_time) || "Non renseignee"}
                </span>
              </p>
              <p className="md:col-span-2">
                <span className="block text-muted-foreground">Resume de seance</span>
                <span className="font-semibold text-foreground">{selectedFollowUpSession.summary || "Non renseigne"}</span>
              </p>
              <p className="md:col-span-2">
                <span className="block text-muted-foreground">Commentaires du mentor</span>
                <span className="font-semibold text-foreground">{selectedFollowUpSession.mentor_comment || "Aucun commentaire"}</span>
              </p>
            </div>

            {selectedFollowUpSession.status === "completed" ? (
              <div className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm md:grid-cols-2">
                <p>
                  <span className="block text-muted-foreground">Appreciation</span>
                  <span className="font-semibold text-foreground">{progressStatusLabels[progressStatus]}</span>
                </p>
                <p>
                  <span className="block text-muted-foreground">Pourcentage d&apos;avancement</span>
                  <span className="font-semibold text-foreground">{getSessionProgressPercentage(selectedFollowUpSession)}%</span>
                </p>
                <p className="md:col-span-2">
                  <span className="block text-muted-foreground">Observations</span>
                  <span className="font-semibold text-foreground">{progress?.achievements || "Non renseignees"}</span>
                </p>
                <p className="md:col-span-2">
                  <span className="block text-muted-foreground">Difficultes</span>
                  <span className="font-semibold text-foreground">{progress?.difficulties || "Non renseignees"}</span>
                </p>
                <p className="md:col-span-2">
                  <span className="block text-muted-foreground">Recommandations</span>
                  <span className="font-semibold text-foreground">{progress?.recommendations || "Non renseignees"}</span>
                </p>
                <p className="md:col-span-2">
                  <span className="block text-muted-foreground">Avis general</span>
                  <span className="font-semibold text-foreground">{progress?.mentor_opinion || "Non renseigne"}</span>
                </p>
              </div>
            ) : (
              <Alert>
                Le suivi detaille sera disponible lorsque cette seance sera marquee comme realisee.
              </Alert>
            )}
          </div>
        ) : null}
      </Modal>

      <Card>
        <CardContent className="grid gap-5 p-5 xl:grid-cols-[1.1fr_1fr_auto] xl:items-start">
          <div className="grid gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{displayName(detail.mentee)}</h2>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="block text-muted-foreground">Niveau</span>
                <span className="font-semibold text-foreground">{detail.mentee.niveau_academique_nom ?? "Non renseigne"}</span>
              </p>
              <p>
                <span className="block text-muted-foreground">Statut global</span>
                <span className="font-semibold text-foreground">{progressStatusLabels[progressStatus]}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="block text-muted-foreground">Periode active</span>
                <span className="font-semibold text-foreground">
                  {assignment.period_detail?.title ?? "Periode"} | {formatDate(assignment.period_detail?.start_date)} -{" "}
                  {formatDate(assignment.period_detail?.end_date)}
                </span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5 xl:text-right">
            <p>
              <span className="block font-semibold text-foreground">{assignment.required_sessions ?? 0}</span>
              Prevues
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
            <p>
              <span className="block font-semibold text-foreground">{progressPercentage}%</span>
              Avancement
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
          <CardDescription>Liste des rencontres, statuts, resumes et commentaires.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {detail.sessions.length > 0 ? (
            <ul className="grid gap-3">
              {detail.sessions.map((session) => (
                <li key={session.id} className="rounded-lg border border-border bg-muted/25 p-4">
                  <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={session.status === "completed" ? "success" : "outline"}>
                          {sessionStatusLabels[session.status]}
                        </Badge>
                        <span className="font-semibold">Seance {session.session_number}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatDate(session.scheduled_date)} | {normalizeTime(session.start_time) || "Heure non renseignee"}
                        {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <p>
                        <span className="block text-muted-foreground">Resume</span>
                        <span className="font-semibold text-foreground">{session.summary || "Non renseigne"}</span>
                      </p>
                      <p>
                        <span className="block text-muted-foreground">Commentaire</span>
                        <span className="font-semibold text-foreground">{session.mentor_comment || "Aucun commentaire"}</span>
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit xl:justify-self-end"
                      onClick={() => setSelectedFollowUpSession(session)}
                    >
                      <Eye aria-hidden="true" />
                      Voir le suivi
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune seance programmee pour ce mentore.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
