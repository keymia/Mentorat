"use client";

import { CalendarPlus, Eye } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListTable } from "@/components/ui/list-table";
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
  return name || "Mentoré non renseigné";
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
    const sessionNumber = Number(formString(formData, "session_number"));
    setError("");
    setMessage("");
    if (!Number.isFinite(sessionNumber) || sessionNumber <= 0) {
      setError("Le numéro de séance attribué est invalide.");
      return;
    }
    try {
      await createMentorAssignmentSession(detail.current_assignment.id, {
        session_number: sessionNumber,
        scheduled_date: formString(formData, "scheduled_date"),
        start_time: nullableTime(formString(formData, "start_time")),
        end_time: nullableTime(formString(formData, "end_time")),
        status: "scheduled",
        summary: formString(formData, "summary"),
        mentor_comment: formString(formData, "mentor_comment"),
      });
      formElement.reset();
      setIsCreateSessionOpen(false);
      setMessage("Séance programmée.");
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
  const nextSessionNumber = detail.sessions.reduce((maxNumber, session) => Math.max(maxNumber, session.session_number), 0) + 1;

  function renderCreateSessionForm() {
    return (
      <form onSubmit={handleCreateSession} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label>
          Numéro de séance
          <Input value={String(nextSessionNumber)} readOnly />
          <input type="hidden" name="session_number" value={String(nextSessionNumber)} />
        </label>
        <label>
          Date
          <Input name="scheduled_date" type="date" required />
        </label>
        <label>
          Début
          <Input name="start_time" type="time" />
        </label>
        <label>
          Fin
          <Input name="end_time" type="time" />
        </label>
        <label className="md:col-span-2">
          Résumé
          <Textarea name="summary" />
        </label>
        <label className="md:col-span-2">
          Commentaire
          <Textarea name="mentor_comment" />
        </label>
        <Button type="submit" className="w-fit">
          <CalendarPlus aria-hidden="true" />
          Créer la séance
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
        title="Créer une séance"
        description="Planifiez la date, l’horaire et les premiers commentaires de suivi."
        onClose={closeCreateSessionModal}
      >
        {renderCreateSessionForm()}
      </Modal>

      <Modal
        open={Boolean(selectedFollowUpSession)}
        title={selectedFollowUpSession ? `Suivi - Séance ${selectedFollowUpSession.session_number}` : "Suivi de séance"}
        description="Informations de la séance et détails du suivi lorsque la rencontre est réalisée."
        onClose={() => setSelectedFollowUpSession(null)}
      >
        {selectedFollowUpSession ? (
          <div className="grid gap-5">
            <div className="grid gap-3 rounded-lg border border-border bg-muted/25 p-4 text-sm md:grid-cols-2">
              <p>
                <span className="block text-muted-foreground">Statut de la séance</span>
                <span className="font-semibold text-foreground">{sessionStatusLabels[selectedFollowUpSession.status]}</span>
              </p>
              <p>
                <span className="block text-muted-foreground">Date</span>
                <span className="font-semibold text-foreground">{formatDate(selectedFollowUpSession.scheduled_date)}</span>
              </p>
              <p>
                <span className="block text-muted-foreground">Heure de début</span>
                <span className="font-semibold text-foreground">
                  {normalizeTime(selectedFollowUpSession.start_time) || "Non renseignée"}
                </span>
              </p>
              <p>
                <span className="block text-muted-foreground">Heure de fin</span>
                <span className="font-semibold text-foreground">
                  {normalizeTime(selectedFollowUpSession.end_time) || "Non renseignée"}
                </span>
              </p>
              <p className="md:col-span-2">
                <span className="block text-muted-foreground">Résumé de séance</span>
                <span className="font-semibold text-foreground">{selectedFollowUpSession.summary || "Non renseigné"}</span>
              </p>
              <p className="md:col-span-2">
                <span className="block text-muted-foreground">Commentaires du mentor</span>
                <span className="font-semibold text-foreground">{selectedFollowUpSession.mentor_comment || "Aucun commentaire"}</span>
              </p>
            </div>

            {selectedFollowUpSession.status === "completed" ? (
              <div className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm md:grid-cols-2">
                <p>
                  <span className="block text-muted-foreground">Appréciation</span>
                  <span className="font-semibold text-foreground">{progressStatusLabels[progressStatus]}</span>
                </p>
                <p>
                  <span className="block text-muted-foreground">Pourcentage d&apos;avancement</span>
                  <span className="font-semibold text-foreground">{getSessionProgressPercentage(selectedFollowUpSession)}%</span>
                </p>
                <p className="md:col-span-2">
                  <span className="block text-muted-foreground">Observations</span>
                  <span className="font-semibold text-foreground">{progress?.achievements || "Non renseignées"}</span>
                </p>
                <p className="md:col-span-2">
                  <span className="block text-muted-foreground">Difficultés</span>
                  <span className="font-semibold text-foreground">{progress?.difficulties || "Non renseignées"}</span>
                </p>
                <p className="md:col-span-2">
                  <span className="block text-muted-foreground">Recommandations</span>
                  <span className="font-semibold text-foreground">{progress?.recommendations || "Non renseignées"}</span>
                </p>
                <p className="md:col-span-2">
                  <span className="block text-muted-foreground">Avis général</span>
                  <span className="font-semibold text-foreground">{progress?.mentor_opinion || "Non renseigné"}</span>
                </p>
              </div>
            ) : (
              <Alert>
                Le suivi détaillé sera disponible lorsque cette séance sera marquée comme réalisée.
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
                <span className="font-semibold text-foreground">{detail.mentee.niveau_academique_nom ?? "Non renseigné"}</span>
              </p>
              <p>
                <span className="block text-muted-foreground">Statut global</span>
                <span className="font-semibold text-foreground">{progressStatusLabels[progressStatus]}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="block text-muted-foreground">Période active</span>
                <span className="font-semibold text-foreground">
                  {assignment.period_detail?.title ?? "Période"} | {formatDate(assignment.period_detail?.start_date)} -{" "}
                  {formatDate(assignment.period_detail?.end_date)}
                </span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5 xl:text-right">
            <p>
              <span className="block font-semibold text-foreground">{assignment.required_sessions ?? 0}</span>
              Prévues
            </p>
            <p>
              <span className="block font-semibold text-foreground">{assignment.scheduled_sessions_count}</span>
              Programmées
            </p>
            <p>
              <span className="block font-semibold text-foreground">{assignment.completed_sessions_count}</span>
              Réalisées
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
              Créer une séance
            </Button>
          </div>
        </CardContent>
      </Card>

      <ListTable
        title="Séances"
        countLabel="Liste des rencontres, statuts, résumés et commentaires."
        minWidth={980}
        headers={[
          { label: "Séance" },
          { label: "Résumé" },
          { label: "Commentaire" },
          { label: "Statut" },
          { label: "Actions", className: "text-right" },
        ]}
        emptyState={
          detail.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune séance programmée pour ce mentoré.</p>
          ) : null
        }
      >
        {detail.sessions.map((session) => (
          <tr key={session.id} className="align-top">
            <td className="px-4 py-3">
              <p className="font-medium text-foreground">Séance {session.session_number}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(session.scheduled_date)} | {normalizeTime(session.start_time) || "Heure non renseignée"}
                {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
              </p>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              <p className="line-clamp-2 max-w-sm">{session.summary || "Non renseigné"}</p>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              <p className="line-clamp-2 max-w-sm">{session.mentor_comment || "Aucun commentaire"}</p>
            </td>
            <td className="px-4 py-3">
              <Badge variant={session.status === "completed" ? "success" : "outline"}>
                {sessionStatusLabels[session.status]}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setSelectedFollowUpSession(session)}
              >
                <Eye aria-hidden="true" />
                Voir le suivi
              </Button>
            </td>
          </tr>
        ))}
      </ListTable>
    </div>
  );
}
