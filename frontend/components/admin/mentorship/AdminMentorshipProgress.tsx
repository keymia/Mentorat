"use client";

import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MentoreeProgress,
  MentorshipPeriod,
  UtilisateurDetail,
  formatApiError,
  getAdminMentorshipProgress,
  getMentorshipPeriods,
  getUsersByProfil,
} from "@/lib/api";
import { displayUser, formatDateTime, progressStatusLabels } from "@/lib/mentorship";

export function AdminMentorshipProgress() {
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [mentors, setMentors] = useState<UtilisateurDetail[]>([]);
  const [mentees, setMentees] = useState<UtilisateurDetail[]>([]);
  const [progressRows, setProgressRows] = useState<MentoreeProgress[]>([]);
  const [filters, setFilters] = useState({ period: "", mentor: "", mentoree: "", progress_status: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const currentFilters = {
      period: filters.period,
      mentor: filters.mentor,
      mentoree: filters.mentoree,
      progress_status: filters.progress_status,
    };
    Promise.all([
      getMentorshipPeriods(),
      getUsersByProfil("MENTOR,MENTOR_ET_MENTORE"),
      getUsersByProfil("MENTORE,MENTOR_ET_MENTORE"),
      getAdminMentorshipProgress(currentFilters),
    ])
      .then(([periodData, mentorData, menteeData, progressData]) => {
        if (isMounted) {
          setPeriods(periodData);
          setMentors(mentorData);
          setMentees(menteeData);
          setProgressRows(progressData);
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
  }, [filters.period, filters.mentor, filters.mentoree, filters.progress_status]);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Suivis des mentores</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Consultez les avis, difficultes, progres observes et recommandations.
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
            Avancement
            <select
              className="field"
              value={filters.progress_status}
              onChange={(event) => setFilters({ ...filters, progress_status: event.target.value })}
            >
              <option value="">Tous</option>
              {Object.entries(progressStatusLabels).map(([value, label]) => (
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
        {progressRows.map((progress) => (
          <Card key={progress.id}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h2 className="font-semibold">{displayUser(progress.mentoree_detail)}</h2>
                    <Badge variant={progress.progress_status === "difficulty" ? "outline" : "success"}>
                      {progressStatusLabels[progress.progress_status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Mentor: {displayUser(progress.mentor_detail)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Mise a jour: {formatDateTime(progress.updated_at)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Progression: {progress.progress_percentage ?? "Non renseignee"}%
                  </p>
                </div>
                <div className="grid max-w-2xl gap-2 text-sm leading-6 text-muted-foreground">
                  {progress.achievements ? <p>Progres: {progress.achievements}</p> : null}
                  {progress.difficulties ? <p>Difficultes: {progress.difficulties}</p> : null}
                  {progress.recommendations ? <p>Recommandations: {progress.recommendations}</p> : null}
                  {progress.mentor_opinion ? <p>Avis: {progress.mentor_opinion}</p> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
