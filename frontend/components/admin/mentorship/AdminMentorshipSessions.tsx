"use client";

import { CalendarClock, Eye } from "lucide-react";
import { useEffect, useState } from "react";

import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
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
  const [detailsSession, setDetailsSession] = useState<MentorshipSession | null>(null);
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
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Séances de mentorat</h1>
            <HelpIconButton moduleKey="sessions" scope="admin" />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Consultez les séances programmées, réalisées, reportées ou annulées.
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

      {!isLoading ? (
        <ListTable
          title="Liste des séances"
          countLabel={`${sessions.length} séance${sessions.length > 1 ? "s" : ""}`}
          minWidth={1080}
          headers={[
            { label: "Numéro" },
            { label: "Date" },
            { label: "Heure" },
            { label: "Mentor" },
            { label: "Mentoré" },
            { label: "Objet" },
            { label: "Statut" },
            { label: "Actions", className: "text-right" },
          ]}
          emptyState={sessions.length === 0 ? <EmptyState icon={CalendarClock} title="Aucune séance à afficher." /> : null}
        >
          {sessions.map((session) => (
            <tr key={session.id} className="align-top">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
                  <p className="font-medium text-foreground">Séance {session.session_number}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(session.scheduled_date)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {normalizeTime(session.start_time)}
                {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{displayUser(session.mentor_detail)}</td>
              <td className="px-4 py-3 text-muted-foreground">{displayUser(session.mentoree_detail)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                <p className="line-clamp-1 max-w-xs">{session.summary || "Non renseigné"}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant={session.status === "completed" ? "success" : "outline"}>
                  {sessionStatusLabels[session.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Button type="button" variant="ghost" size="sm" onClick={() => setDetailsSession(session)}>
                  <Eye aria-hidden="true" />
                  Détails
                </Button>
              </td>
            </tr>
          ))}
        </ListTable>
      ) : null}

      <Modal
        open={Boolean(detailsSession)}
        title="Détails de la séance"
        description="Informations complètes de la séance sélectionnée."
        className="max-w-3xl"
        onClose={() => setDetailsSession(null)}
      >
        {detailsSession ? (
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
            <DetailItem label="Numéro" value={`Séance ${detailsSession.session_number}`} />
            <DetailItem label="Statut" value={sessionStatusLabels[detailsSession.status]} />
            <DetailItem label="Date" value={formatDate(detailsSession.scheduled_date)} />
            <DetailItem
              label="Heure"
              value={`${normalizeTime(detailsSession.start_time)}${detailsSession.end_time ? ` - ${normalizeTime(detailsSession.end_time)}` : ""}`}
            />
            <DetailItem label="Mentor" value={displayUser(detailsSession.mentor_detail)} />
            <DetailItem label="Mentoré" value={displayUser(detailsSession.mentoree_detail)} />
            <DetailItem label="Objet" value={detailsSession.summary || "Non renseigné"} className="md:col-span-2" />
            <DetailItem label="Commentaire mentor" value={detailsSession.mentor_comment || "Non renseigné"} className="md:col-span-2" />
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
