"use client";

import { CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MentorshipFilters,
  MentorshipPeriod,
  MentorshipSession,
  UtilisateurDetail,
  formatApiError,
  getAdminMentorshipSessions,
  getMentorshipPeriods,
  getUsersByProfil,
} from "@/lib/api";
import { displayUser, formatDate, normalizeTime, sessionStatusLabels } from "@/lib/mentorship";

const sessionStatusOptions = Object.entries(sessionStatusLabels);

type AdminMentorshipSessionsProps = {
  showHeader?: boolean;
  showFilters?: boolean;
  filters?: MentorshipFilters;
};

const emptyFilters = { period: "", mentor: "", mentoree: "", status: "" };

export function AdminMentorshipSessions({
  showHeader = true,
  showFilters = true,
  filters,
}: AdminMentorshipSessionsProps) {
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [mentors, setMentors] = useState<UtilisateurDetail[]>([]);
  const [mentees, setMentees] = useState<UtilisateurDetail[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [localFilters, setLocalFilters] = useState(emptyFilters);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const activeFilters = filters ?? localFilters;

  useEffect(() => {
    let isMounted = true;
    const currentFilters = {
      period: activeFilters.period ?? "",
      mentor: activeFilters.mentor ?? "",
      mentoree: activeFilters.mentoree ?? "",
      status: activeFilters.status ?? "",
    };
    Promise.all([
      getMentorshipPeriods(),
      getUsersByProfil("MENTOR,MENTOR_ET_MENTORE"),
      getUsersByProfil("MENTORE,MENTOR_ET_MENTORE"),
      getAdminMentorshipSessions(currentFilters),
    ])
      .then(([periodData, mentorData, menteeData, sessionData]) => {
        if (isMounted) {
          setPeriods(periodData);
          setMentors(mentorData);
          setMentees(menteeData);
          setSessions(sessionData);
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
  }, [activeFilters.period, activeFilters.mentor, activeFilters.mentoree, activeFilters.status]);

  return (
    <div className="grid gap-5">
      {showHeader ? (
        <div>
          <h1 className="font-display text-3xl font-bold">Seances de mentorat</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Consultez les seances programmees, realisees, reportees ou annulees.
          </p>
        </div>
      ) : null}

      {error ? <Alert variant="error">{error}</Alert> : null}

      {showFilters ? (
      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <label>
            Periode
            <select className="field" value={localFilters.period} onChange={(event) => setLocalFilters({ ...localFilters, period: event.target.value })}>
              <option value="">Toutes</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mentor
            <select className="field" value={localFilters.mentor} onChange={(event) => setLocalFilters({ ...localFilters, mentor: event.target.value })}>
              <option value="">Tous</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {displayUser(mentor)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mentore
            <select className="field" value={localFilters.mentoree} onChange={(event) => setLocalFilters({ ...localFilters, mentoree: event.target.value })}>
              <option value="">Tous</option>
              {mentees.map((mentee) => (
                <option key={mentee.id} value={mentee.id}>
                  {displayUser(mentee)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Statut
            <select className="field" value={localFilters.status} onChange={(event) => setLocalFilters({ ...localFilters, status: event.target.value })}>
              <option value="">Tous</option>
              {sessionStatusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>
      ) : null}

      {isLoading ? <Skeleton className="h-64" /> : null}

      <div className="grid gap-3">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h2 className="font-semibold">Seance {session.session_number}</h2>
                    <Badge variant={session.status === "completed" ? "success" : "outline"}>
                      {sessionStatusLabels[session.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(session.scheduled_date)} {normalizeTime(session.start_time)}
                    {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Mentor: {displayUser(session.mentor_detail)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Mentore: {displayUser(session.mentoree_detail)}</p>
                </div>
                <div className="max-w-xl text-sm leading-6 text-muted-foreground">
                  {session.summary ? <p>Resume: {session.summary}</p> : null}
                  {session.mentor_comment ? <p>Commentaire: {session.mentor_comment}</p> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
