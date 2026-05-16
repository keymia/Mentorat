"use client";

import { Eye, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MentoreeProgress,
  MentorshipFilters,
  MentorshipPeriod,
  UtilisateurDetail,
  formatApiError,
  getAdminMentorshipProgress,
  getMentorshipPeriods,
  getUsersByProfil,
} from "@/lib/api";
import { displayUser, formatDateTime, progressStatusLabels } from "@/lib/mentorship";

type AdminMentorshipProgressProps = {
  showHeader?: boolean;
  showFilters?: boolean;
  filters?: MentorshipFilters;
};

const emptyFilters = { period: "", mentor: "", mentoree: "", progress_status: "" };

export function AdminMentorshipProgress({
  showHeader = true,
  showFilters = true,
  filters,
}: AdminMentorshipProgressProps) {
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [mentors, setMentors] = useState<UtilisateurDetail[]>([]);
  const [mentees, setMentees] = useState<UtilisateurDetail[]>([]);
  const [progressRows, setProgressRows] = useState<MentoreeProgress[]>([]);
  const [localFilters, setLocalFilters] = useState(emptyFilters);
  const [detailsProgress, setDetailsProgress] = useState<MentoreeProgress | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const activeFilters = filters ?? localFilters;

  useEffect(() => {
    let isMounted = true;
    const currentFilters = {
      period: activeFilters.period ?? "",
      mentor: activeFilters.mentor ?? "",
      mentoree: activeFilters.mentoree ?? "",
      progress_status: activeFilters.progress_status ?? "",
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
  }, [activeFilters.period, activeFilters.mentor, activeFilters.mentoree, activeFilters.progress_status]);

  return (
    <div className="grid gap-5">
      {showHeader ? (
        <div>
          <h1 className="font-display text-3xl font-bold">Suivis des mentorés</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Consultez les avis, difficultés, progrès observés et recommandations.
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
            Avancement
            <select
              className="field"
              value={localFilters.progress_status}
              onChange={(event) => setLocalFilters({ ...localFilters, progress_status: event.target.value })}
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
      ) : null}

      {isLoading ? <Skeleton className="h-64" /> : null}

      {!isLoading ? (
        <ListTable
          title="Liste des suivis"
          countLabel={`${progressRows.length} suivi${progressRows.length > 1 ? "s" : ""}`}
          minWidth={1120}
          headers={[
            { label: "Mentoré" },
            { label: "Mentor" },
            { label: "Statut" },
            { label: "Pourcentage" },
            { label: "Mise à jour" },
            { label: "Actions", className: "text-right" },
          ]}
          emptyState={progressRows.length === 0 ? <EmptyState icon={TrendingUp} title="Aucun suivi à afficher." /> : null}
        >
          {progressRows.map((progress) => (
            <tr key={progress.id} className="align-top">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
                  <p className="font-medium text-foreground">{displayUser(progress.mentoree_detail)}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{displayUser(progress.mentor_detail)}</td>
              <td className="px-4 py-3">
                <Badge variant={progress.progress_status === "difficulty" ? "outline" : "success"}>
                  {progressStatusLabels[progress.progress_status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{progress.progress_percentage ?? "Non renseignée"}%</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(progress.updated_at)}</td>
              <td className="px-4 py-3 text-right">
                <Button type="button" variant="ghost" size="sm" onClick={() => setDetailsProgress(progress)}>
                  <Eye aria-hidden="true" />
                  Détails
                </Button>
              </td>
            </tr>
          ))}
        </ListTable>
      ) : null}

      <Modal
        open={Boolean(detailsProgress)}
        title="Détails du suivi"
        description="Synthèse complète du suivi sélectionné."
        className="max-w-3xl"
        onClose={() => setDetailsProgress(null)}
      >
        {detailsProgress ? (
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
            <DetailItem label="Mentoré" value={displayUser(detailsProgress.mentoree_detail)} />
            <DetailItem label="Mentor" value={displayUser(detailsProgress.mentor_detail)} />
            <DetailItem label="Statut" value={progressStatusLabels[detailsProgress.progress_status]} />
            <DetailItem label="Pourcentage" value={`${detailsProgress.progress_percentage ?? "Non renseigné"}%`} />
            <DetailItem label="Progrès" value={detailsProgress.achievements || "Non renseigné"} className="md:col-span-2" />
            <DetailItem label="Difficultés" value={detailsProgress.difficulties || "Non renseigné"} className="md:col-span-2" />
            <DetailItem label="Recommandations" value={detailsProgress.recommendations || "Non renseigné"} className="md:col-span-2" />
            <DetailItem label="Avis du mentor" value={detailsProgress.mentor_opinion || "Non renseigné"} className="md:col-span-2" />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function DetailItem({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
