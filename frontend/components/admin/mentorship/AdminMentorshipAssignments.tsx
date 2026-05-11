"use client";

import { Handshake, RefreshCcw, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MentorshipAssignment,
  MentorshipAssignmentStatus,
  MentorshipPeriod,
  UtilisateurDetail,
  createMentorshipAssignment,
  formatApiError,
  getMentorshipAssignments,
  getMentorshipPeriods,
  getUsersByProfil,
  updateMentorshipAssignment,
} from "@/lib/api";
import { assignmentStatusLabels, displayUser, formatDate, periodStatusLabels } from "@/lib/mentorship";

type AssignmentDraft = {
  mentor: string;
  mentoree: string;
  period: string;
  status: MentorshipAssignmentStatus;
  admin_notes: string;
};

const emptyDraft: AssignmentDraft = {
  mentor: "",
  mentoree: "",
  period: "",
  status: "active",
  admin_notes: "",
};

export function AdminMentorshipAssignments() {
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [mentors, setMentors] = useState<UtilisateurDetail[]>([]);
  const [mentees, setMentees] = useState<UtilisateurDetail[]>([]);
  const [assignments, setAssignments] = useState<MentorshipAssignment[]>([]);
  const [draft, setDraft] = useState<AssignmentDraft>(emptyDraft);
  const [filters, setFilters] = useState({ period: "", status: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reassigningAssignment, setReassigningAssignment] = useState<MentorshipAssignment | null>(null);
  const [reassignMentorId, setReassignMentorId] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);

  const activePeriods = useMemo(() => periods.filter((period) => period.status === "active"), [periods]);

  async function loadData() {
    try {
      const [periodData, mentorData, menteeData, assignmentData] = await Promise.all([
        getMentorshipPeriods(),
        getUsersByProfil("MENTOR,MENTOR_ET_MENTORE"),
        getUsersByProfil("MENTORE,MENTOR_ET_MENTORE"),
        getMentorshipAssignments(filters),
      ]);
      setPeriods(periodData);
      setMentors(mentorData.filter((mentor) => !mentor.niveau_academique_est_premier_niveau));
      setMentees(menteeData);
      setAssignments(assignmentData);
      setError("");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    const currentFilters = {
      period: filters.period,
      status: filters.status,
    };
    Promise.all([
      getMentorshipPeriods(),
      getUsersByProfil("MENTOR,MENTOR_ET_MENTORE"),
      getUsersByProfil("MENTORE,MENTOR_ET_MENTORE"),
      getMentorshipAssignments(currentFilters),
    ])
      .then(([periodData, mentorData, menteeData, assignmentData]) => {
        if (isMounted) {
          setPeriods(periodData);
          setMentors(mentorData.filter((mentor) => !mentor.niveau_academique_est_premier_niveau));
          setMentees(menteeData);
          setAssignments(assignmentData);
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
  }, [filters.period, filters.status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      await createMentorshipAssignment({
        mentor: Number(draft.mentor),
        mentoree: Number(draft.mentoree),
        period: Number(draft.period),
        status: draft.status,
        admin_notes: draft.admin_notes,
      });
      setDraft(emptyDraft);
      setIsCreateOpen(false);
      setMessage("Affectation creee.");
      await loadData();
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus(assignment: MentorshipAssignment, status: MentorshipAssignmentStatus) {
    setError("");
    setMessage("");
    try {
      await updateMentorshipAssignment(assignment.id, { status });
      setMessage("Affectation mise a jour.");
      await loadData();
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  function openCreateModal() {
    setDraft(emptyDraft);
    setMessage("");
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    setDraft(emptyDraft);
    setIsCreateOpen(false);
  }

  function openReassignModal(assignment: MentorshipAssignment) {
    setReassigningAssignment(assignment);
    setReassignMentorId(String(assignment.mentor));
    setMessage("");
    setError("");
  }

  function closeReassignModal() {
    setReassigningAssignment(null);
    setReassignMentorId("");
  }

  async function handleReassignSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reassigningAssignment || !reassignMentorId) {
      return;
    }
    setIsReassigning(true);
    setError("");
    setMessage("");
    try {
      await updateMentorshipAssignment(reassigningAssignment.id, { mentor: Number(reassignMentorId) });
      setMessage("Mentore reassigne au nouveau mentor.");
      closeReassignModal();
      await loadData();
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsReassigning(false);
    }
  }

  function renderAssignmentForm() {
    return (
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        <label>
          Periode
          <select
            className="field"
            required
            value={draft.period}
            onChange={(event) => setDraft({ ...draft, period: event.target.value })}
          >
            <option value="">Choisir une periode</option>
            {(activePeriods.length > 0 ? activePeriods : periods).map((period) => (
              <option key={period.id} value={period.id}>
                {period.title} - {periodStatusLabels[period.status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Statut
          <select
            className="field"
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as MentorshipAssignmentStatus })}
          >
            {Object.entries(assignmentStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mentor
          <select
            className="field"
            required
            value={draft.mentor}
            onChange={(event) => setDraft({ ...draft, mentor: event.target.value })}
          >
            <option value="">Choisir un mentor</option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {displayUser(mentor)} - {mentor.niveau_academique_nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mentore
          <select
            className="field"
            required
            value={draft.mentoree}
            onChange={(event) => setDraft({ ...draft, mentoree: event.target.value })}
          >
            <option value="">Choisir un mentore</option>
            {mentees.map((mentee) => (
              <option key={mentee.id} value={mentee.id}>
                {displayUser(mentee)} - {mentee.niveau_academique_nom}
              </option>
            ))}
          </select>
        </label>
        <label className="lg:col-span-2">
          Notes administratives
          <textarea
            className="field"
            rows={3}
            value={draft.admin_notes}
            onChange={(event) => setDraft({ ...draft, admin_notes: event.target.value })}
          />
        </label>
        <Button type="submit" disabled={isSaving} className="w-fit">
          <Handshake aria-hidden="true" />
          {isSaving ? "Creation..." : "Creer l'affectation"}
        </Button>
      </form>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Affectations mentorales</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Reliez un mentor et un mentore a une periode de mentorat.
          </p>
        </div>
        <Button type="button" className="w-fit" onClick={openCreateModal}>
          <Handshake aria-hidden="true" />
          Creer une affectation
        </Button>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      <Modal
        open={isCreateOpen}
        title="Creer une affectation"
        description="Associez un mentor, un mentore et une periode de mentorat."
        onClose={closeCreateModal}
      >
        {renderAssignmentForm()}
      </Modal>

      <Modal
        open={Boolean(reassigningAssignment)}
        title="Reassigner le mentore"
        description="Choisissez le nouveau mentor pour cette affectation."
        onClose={closeReassignModal}
      >
        <form onSubmit={handleReassignSubmit} className="grid gap-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p>
              Mentore:{" "}
              <span className="font-medium text-foreground">
                {displayUser(reassigningAssignment?.mentoree_detail)}
              </span>
            </p>
            <p className="mt-1">
              Periode:{" "}
              <span className="font-medium text-foreground">
                {reassigningAssignment?.period_detail?.title ?? "Non renseignee"}
              </span>
            </p>
          </div>
          <label>
            Nouveau mentor
            <select
              className="field"
              required
              value={reassignMentorId}
              onChange={(event) => setReassignMentorId(event.target.value)}
            >
              <option value="">Choisir un mentor</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {displayUser(mentor)} - {mentor.niveau_academique_nom}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isReassigning}>
              <RefreshCcw aria-hidden="true" />
              {isReassigning ? "Reassignation..." : "Reassigner"}
            </Button>
            <Button type="button" variant="outline" onClick={closeReassignModal}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2">
          <label>
            Filtrer par periode
            <select
              className="field"
              value={filters.period}
              onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value }))}
            >
              <option value="">Toutes les periodes</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Filtrer par statut
            <select
              className="field"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">Tous les statuts</option>
              {Object.entries(assignmentStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      {isLoading ? <Skeleton className="h-64" /> : null}

      <div className="grid gap-3">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{displayUser(assignment.mentoree_detail)}</h2>
                    <Badge variant={assignment.status === "active" ? "success" : "outline"}>
                      {assignmentStatusLabels[assignment.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Mentor: {displayUser(assignment.mentor_detail)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {assignment.period_detail?.title ?? "Periode"} | {formatDate(assignment.period_detail?.start_date)} -{" "}
                    {formatDate(assignment.period_detail?.end_date)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {assignment.completed_sessions_count}/{assignment.required_sessions ?? 0} seances realisees,{" "}
                    {assignment.missing_sessions_count} a programmer
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void changeStatus(assignment, "active")}>
                    <Save aria-hidden="true" />
                    Active
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => openReassignModal(assignment)}>
                    <RefreshCcw aria-hidden="true" />
                    Reassigner
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => void changeStatus(assignment, "completed")}>
                    Terminer
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => void changeStatus(assignment, "suspended")}>
                    Suspendre
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
