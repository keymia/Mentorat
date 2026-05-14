"use client";

import { CalendarClock, CalendarPlus, Eye, Pencil, Save } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  MentorshipAssignment,
  MentorshipSession,
  MentorshipSessionStatus,
  createMentorSession,
  formatApiError,
  getMentorAssignments,
  getMentorSessions,
  updateMentorSession,
} from "@/lib/api";
import { displayUser, formatDate, normalizeTime, sessionStatusLabels } from "@/lib/mentorship";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function nullableTime(value: string) {
  return value ? value : null;
}

function validateSessionForm(formData: FormData, assignment?: MentorshipAssignment) {
  const sessionNumber = Number(formString(formData, "session_number"));
  const scheduledDate = formString(formData, "scheduled_date");
  const startTime = formString(formData, "start_time");
  const endTime = formString(formData, "end_time");
  const summary = formString(formData, "summary").trim();

  if (!assignment) {
    return "Le mentore est obligatoire.";
  }
  if (!sessionNumber) {
    return "Le numero de seance est obligatoire.";
  }
  if (!scheduledDate) {
    return "La date est obligatoire.";
  }
  if (startTime && endTime && startTime >= endTime) {
    return "L'heure de debut doit etre avant l'heure de fin.";
  }
  if (!summary) {
    return "L'objet de la seance est obligatoire.";
  }
  if (assignment.required_sessions && sessionNumber > assignment.required_sessions) {
    return "Le numero de seance depasse le nombre de seances prevues.";
  }
  return "";
}

export function MentorSessionsList() {
  const [assignments, setAssignments] = useState<MentorshipAssignment[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [detailSession, setDetailSession] = useState<MentorshipSession | null>(null);
  const [editSession, setEditSession] = useState<MentorshipSession | null>(null);

  const assignmentsById = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.id, assignment])),
    [assignments],
  );
  const selectedAssignment = selectedAssignmentId ? assignmentsById.get(Number(selectedAssignmentId)) : undefined;

  const loadData = useCallback(async () => {
    try {
      const [assignmentRows, sessionRows] = await Promise.all([getMentorAssignments(), getMentorSessions()]);
      setAssignments(assignmentRows);
      setSessions(sessionRows);
      setError("");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getMentorAssignments(), getMentorSessions()])
      .then(([assignmentRows, sessionRows]) => {
        if (isMounted) {
          setAssignments(assignmentRows);
          setSessions(sessionRows);
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

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const assignment = assignmentsById.get(Number(formString(formData, "assignment")));
    const validationError = validateSessionForm(formData, assignment);
    setFormError(validationError);
    setMessage("");
    if (validationError || !assignment) {
      return;
    }

    setIsSaving(true);
    try {
      await createMentorSession({
        assignment: assignment.id,
        session_number: Number(formString(formData, "session_number")),
        scheduled_date: formString(formData, "scheduled_date"),
        start_time: nullableTime(formString(formData, "start_time")),
        end_time: nullableTime(formString(formData, "end_time")),
        summary: formString(formData, "summary"),
        mentor_comment: "",
        status: "scheduled",
      });
      formElement.reset();
      setSelectedAssignmentId("");
      setIsCreateOpen(false);
      setMessage("Seance creee.");
      await loadData();
    } catch (apiError) {
      setFormError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editSession) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const assignment = assignmentsById.get(editSession.assignment);
    const validationError = validateSessionForm(formData, assignment);
    setFormError(validationError);
    setMessage("");
    if (validationError) {
      return;
    }

    setIsSaving(true);
    try {
      await updateMentorSession(editSession.id, {
        session_number: Number(formString(formData, "session_number")),
        scheduled_date: formString(formData, "scheduled_date"),
        start_time: nullableTime(formString(formData, "start_time")),
        end_time: nullableTime(formString(formData, "end_time")),
        status: formString(formData, "status") as MentorshipSessionStatus,
        summary: formString(formData, "summary"),
        mentor_comment: formString(formData, "mentor_comment"),
      });
      setEditSession(null);
      setMessage("Seance modifiee.");
      await loadData();
    } catch (apiError) {
      setFormError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  function openCreateModal() {
    setFormError("");
    setMessage("");
    setIsCreateOpen(true);
  }

  function openEditModal(session: MentorshipSession) {
    setFormError("");
    setMessage("");
    setEditSession(session);
  }

  function renderCreateForm() {
    return (
      <form onSubmit={handleCreateSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          Mentore
          <select
            name="assignment"
            className="field"
            value={selectedAssignmentId}
            onChange={(event) => setSelectedAssignmentId(event.target.value)}
            required
          >
            <option value="">Choisir un mentore</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {displayUser(assignment.mentoree_detail)} - {assignment.period_detail?.title ?? "Periode active"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Numero de seance
          <Input name="session_number" type="number" min={1} max={selectedAssignment?.required_sessions} required />
        </label>
        <label>
          Date
          <Input name="scheduled_date" type="date" required />
        </label>
        <label>
          Heure de debut
          <Input name="start_time" type="time" />
        </label>
        <label>
          Heure de fin
          <Input name="end_time" type="time" />
        </label>
        <label className="md:col-span-2">
          Objet de la seance
          <Textarea name="summary" required />
        </label>
        {formError ? <Alert variant="error" className="md:col-span-2">{formError}</Alert> : null}
        <Button type="submit" className="w-fit" disabled={isSaving}>
          <CalendarPlus aria-hidden="true" />
          {isSaving ? "Creation..." : "Creer la seance"}
        </Button>
      </form>
    );
  }

  function renderEditForm(session: MentorshipSession) {
    return (
      <form onSubmit={handleEditSubmit} className="grid gap-4 md:grid-cols-2">
        <label>
          Numero de seance
          <Input name="session_number" type="number" min={1} defaultValue={session.session_number} required />
        </label>
        <label>
          Date
          <Input name="scheduled_date" type="date" defaultValue={session.scheduled_date} required />
        </label>
        <label>
          Heure de debut
          <Input name="start_time" type="time" defaultValue={normalizeTime(session.start_time)} />
        </label>
        <label>
          Heure de fin
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
        <label className="md:col-span-2">
          Objet de la seance
          <Textarea name="summary" defaultValue={session.summary} required />
        </label>
        <label className="md:col-span-2">
          Commentaire
          <Textarea name="mentor_comment" defaultValue={session.mentor_comment} />
        </label>
        {formError ? <Alert variant="error" className="md:col-span-2">{formError}</Alert> : null}
        <Button type="submit" className="w-fit" disabled={isSaving}>
          <Save aria-hidden="true" />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Liste des seances</h2>
          <p className="text-sm text-muted-foreground">{sessions.length} seance{sessions.length > 1 ? "s" : ""} au total.</p>
        </div>
        <Button type="button" onClick={openCreateModal} disabled={assignments.length === 0}>
          <CalendarPlus aria-hidden="true" />
          Creer une seance
        </Button>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}

      <Modal
        open={isCreateOpen}
        title="Creer une seance"
        description="Selectionnez le mentore puis indiquez la date, l'horaire et l'objet."
        onClose={() => setIsCreateOpen(false)}
      >
        {renderCreateForm()}
      </Modal>

      <Modal open={Boolean(editSession)} title="Modifier la seance" onClose={() => setEditSession(null)}>
        {editSession ? renderEditForm(editSession) : null}
      </Modal>

      <Modal open={Boolean(detailSession)} title="Details de la seance" onClose={() => setDetailSession(null)}>
        {detailSession ? (
          <div className="grid gap-4 text-sm">
            <div className="grid gap-3 rounded-lg border border-border bg-muted/25 p-4 sm:grid-cols-2">
              <p>
                <span className="block text-muted-foreground">Mentore</span>
                <span className="font-semibold">{displayUser(detailSession.mentoree_detail)}</span>
              </p>
              <p>
                <span className="block text-muted-foreground">Statut</span>
                <span className="font-semibold">{sessionStatusLabels[detailSession.status]}</span>
              </p>
              <p>
                <span className="block text-muted-foreground">Date</span>
                <span className="font-semibold">{formatDate(detailSession.scheduled_date)}</span>
              </p>
              <p>
                <span className="block text-muted-foreground">Horaire</span>
                <span className="font-semibold">
                  {normalizeTime(detailSession.start_time) || "Non renseigne"}
                  {detailSession.end_time ? ` - ${normalizeTime(detailSession.end_time)}` : ""}
                </span>
              </p>
            </div>
            <div>
              <p className="font-semibold">Objet</p>
              <p className="mt-1 text-muted-foreground">{detailSession.summary || "Non renseigne"}</p>
            </div>
            <div>
              <p className="font-semibold">Commentaire</p>
              <p className="mt-1 text-muted-foreground">{detailSession.mentor_comment || "Aucun commentaire"}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      {sessions.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Aucune seance programmee." />
      ) : (
        <ListTable
          title="Liste des seances"
          countLabel={`${sessions.length} seance${sessions.length > 1 ? "s" : ""}`}
          minWidth={1080}
          headers={[
            { label: "Mentore" },
            { label: "Seance" },
            { label: "Objet" },
            { label: "Progression" },
            { label: "Statut" },
            { label: "Actions", className: "text-right" },
          ]}
        >
          {sessions.map((session) => {
            const assignment = assignmentsById.get(session.assignment);
            return (
              <tr key={session.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{displayUser(session.mentoree_detail ?? assignment?.mentoree_detail)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {session.period_detail?.title ?? assignment?.period_detail?.title ?? "Periode active"}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p className="font-medium text-foreground">Seance {session.session_number}</p>
                  <p className="mt-1 text-xs">
                    {formatDate(session.scheduled_date)} | {normalizeTime(session.start_time) || "Heure non renseignee"}
                    {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p className="line-clamp-2 max-w-sm">{session.summary || "Non renseigne"}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {assignment?.completed_sessions_count ?? 0}/{assignment?.required_sessions ?? 0} realisees
                </td>
                <td className="px-4 py-3">
                  <Badge variant={session.status === "completed" ? "success" : "outline"}>
                    {sessionStatusLabels[session.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDetailSession(session)}>
                      <Eye aria-hidden="true" />
                      Details
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(session)}>
                      <Pencil aria-hidden="true" />
                      Modifier
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </ListTable>
      )}
    </div>
  );
}
