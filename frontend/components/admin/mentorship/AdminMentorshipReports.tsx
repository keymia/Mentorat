"use client";

import { AlertTriangle, CheckCircle2, ClipboardList, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

import { StatCard } from "@/components/dashboard/StatCard";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminMentorshipOverview,
  AdminMentorshipReport,
  MentorshipPeriod,
  UtilisateurDetail,
  formatApiError,
  getAdminMentorshipOverview,
  getAdminMentorshipReports,
  getMentorshipPeriods,
  getUsersByProfil,
} from "@/lib/api";
import { assignmentStatusLabels, displayUser } from "@/lib/mentorship";

export function AdminMentorshipReports() {
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [mentors, setMentors] = useState<UtilisateurDetail[]>([]);
  const [mentees, setMentees] = useState<UtilisateurDetail[]>([]);
  const [overview, setOverview] = useState<AdminMentorshipOverview | null>(null);
  const [report, setReport] = useState<AdminMentorshipReport | null>(null);
  const [filters, setFilters] = useState({ period: "", mentor: "", mentoree: "", status: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const currentFilters = {
      period: filters.period,
      mentor: filters.mentor,
      mentoree: filters.mentoree,
      status: filters.status,
    };
    Promise.all([
      getMentorshipPeriods(),
      getUsersByProfil("MENTOR,MENTOR_ET_MENTORE"),
      getUsersByProfil("MENTORE,MENTOR_ET_MENTORE"),
      getAdminMentorshipOverview(currentFilters),
      getAdminMentorshipReports(currentFilters),
    ])
      .then(([periodData, mentorData, menteeData, overviewData, reportData]) => {
        if (isMounted) {
          setPeriods(periodData);
          setMentors(mentorData);
          setMentees(menteeData);
          setOverview(overviewData);
          setReport(reportData);
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
  }, [filters.period, filters.mentor, filters.mentoree, filters.status]);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Rapports mentorat</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Suivez les seances manquantes, les affectations actives et les alertes de progression.
        </p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <label>
            Periode
            <select className="field" value={filters.period} onChange={(event) => setFilters({ ...filters, period: event.target.value })}>
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
            <select className="field" value={filters.mentor} onChange={(event) => setFilters({ ...filters, mentor: event.target.value })}>
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
            <select className="field" value={filters.mentoree} onChange={(event) => setFilters({ ...filters, mentoree: event.target.value })}>
              <option value="">Tous</option>
              {mentees.map((mentee) => (
                <option key={mentee.id} value={mentee.id}>
                  {displayUser(mentee)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Statut affectation
            <select className="field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">Tous</option>
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

      {overview && report ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Affectations" value={overview.assignments.total} icon={UsersRound} tone="red" />
            <StatCard label="Seances realisees" value={overview.sessions.completed} icon={CheckCircle2} tone="bronze" />
            <StatCard label="Seances manquantes" value={report.summary.missing_sessions} icon={AlertTriangle} tone="dark" />
            <StatCard label="Suivis a risque" value={overview.progress.watch + overview.progress.difficulty} icon={ClipboardList} tone="red" />
          </div>

          <div className="grid gap-3">
            {report.results.map((row) => (
              <Card key={row.assignment.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{displayUser(row.assignment.mentoree_detail)}</h2>
                        <Badge variant={row.missing_sessions > 0 ? "outline" : "success"}>
                          {row.missing_sessions > 0 ? `${row.missing_sessions} a programmer` : "Complet"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Mentor: {displayUser(row.assignment.mentor_detail)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{row.assignment.period_detail?.title}</p>
                    </div>
                    <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-4 sm:text-right">
                      <p>Prevues: {row.required_sessions}</p>
                      <p>Programmees: {row.scheduled_sessions}</p>
                      <p>Realisees: {row.completed_sessions}</p>
                      <p>Restantes: {row.remaining_sessions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
