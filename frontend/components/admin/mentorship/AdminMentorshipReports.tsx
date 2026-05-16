"use client";

import { AlertTriangle, CheckCircle2, ClipboardList, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

import { StatCard } from "@/components/dashboard/StatCard";
import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminMentorshipOverview,
  AdminMentorshipReport,
  MentorshipFilters,
  MentorshipPeriod,
  UtilisateurDetail,
  formatApiError,
  getAdminMentorshipOverview,
  getAdminMentorshipReports,
  getMentorshipPeriods,
  getUsersByProfil,
} from "@/lib/api";
import { assignmentStatusLabels, displayUser } from "@/lib/mentorship";

type AdminMentorshipReportsProps = {
  showHeader?: boolean;
  showFilters?: boolean;
  filters?: MentorshipFilters;
};

const emptyFilters = { period: "", mentor: "", mentoree: "", status: "" };

export function AdminMentorshipReports({
  showHeader = true,
  showFilters = true,
  filters,
}: AdminMentorshipReportsProps) {
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [mentors, setMentors] = useState<UtilisateurDetail[]>([]);
  const [mentees, setMentees] = useState<UtilisateurDetail[]>([]);
  const [overview, setOverview] = useState<AdminMentorshipOverview | null>(null);
  const [report, setReport] = useState<AdminMentorshipReport | null>(null);
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
  }, [activeFilters.period, activeFilters.mentor, activeFilters.mentoree, activeFilters.status]);

  return (
    <div className="grid gap-5">
      {showHeader ? (
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Rapports mentorat</h1>
            <HelpIconButton moduleKey="exports_imports" scope="admin" />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Suivez les séances manquantes, les affectations actives et les alertes de progression.
          </p>
        </div>
      ) : null}

      {error ? <Alert variant="error">{error}</Alert> : null}

      {showFilters ? (
      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <label>
            Période
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
            Mentoré
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
            Statut affectation
            <select className="field" value={localFilters.status} onChange={(event) => setLocalFilters({ ...localFilters, status: event.target.value })}>
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
      ) : null}

      {isLoading ? <Skeleton className="h-64" /> : null}

      {overview && report ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Affectations" value={overview.assignments.total} icon={UsersRound} tone="red" />
            <StatCard label="Séances réalisées" value={overview.sessions.completed} icon={CheckCircle2} tone="bronze" />
            <StatCard label="Séances manquantes" value={report.summary.missing_sessions} icon={AlertTriangle} tone="dark" />
            <StatCard label="Suivis à risque" value={overview.progress.watch + overview.progress.difficulty} icon={ClipboardList} tone="red" />
          </div>

          <ListTable
            title="Liste des rapports"
            countLabel={`${report.results.length} affectation${report.results.length > 1 ? "s" : ""}`}
            minWidth={1080}
            headers={[
              { label: "Mentoré" },
              { label: "Mentor" },
              { label: "Période" },
              { label: "Séances" },
              { label: "État" },
            ]}
            emptyState={report.results.length === 0 ? <EmptyState icon={ClipboardList} title="Aucun rapport à afficher." /> : null}
          >
            {report.results.map((row) => (
              <tr key={row.assignment.id} className="align-top">
                <td className="px-4 py-3 font-medium text-foreground">{displayUser(row.assignment.mentoree_detail)}</td>
                <td className="px-4 py-3 text-muted-foreground">{displayUser(row.assignment.mentor_detail)}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.assignment.period_detail?.title ?? "Non renseignée"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p>Prévues : {row.required_sessions}</p>
                  <p className="mt-1 text-xs">Programmées : {row.scheduled_sessions}</p>
                  <p className="mt-1 text-xs">Réalisées : {row.completed_sessions}</p>
                  <p className="mt-1 text-xs">Restantes: {row.remaining_sessions}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={row.missing_sessions > 0 ? "outline" : "success"}>
                    {row.missing_sessions > 0 ? `${row.missing_sessions} à programmer` : "Complet"}
                  </Badge>
                </td>
              </tr>
            ))}
          </ListTable>
        </>
      ) : null}
    </div>
  );
}
