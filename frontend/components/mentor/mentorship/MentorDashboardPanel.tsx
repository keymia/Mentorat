"use client";

import { CalendarClock, ClipboardList, UserRoundCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StatCard } from "@/components/dashboard/StatCard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MentorDashboard, formatApiError, getMentorDashboard } from "@/lib/api";
import { displayUser, formatDate } from "@/lib/mentorship";

export function MentorDashboardPanel() {
  const [dashboard, setDashboard] = useState<MentorDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getMentorDashboard()
      .then((data) => {
        if (isMounted) {
          setDashboard(data);
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(formatApiError(apiError));
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!dashboard) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mentores" value={dashboard.counts.mentees} icon={UsersRound} tone="red" />
        <StatCard label="Seances prevues" value={dashboard.counts.required_sessions} icon={ClipboardList} tone="bronze" />
        <StatCard label="Programmees" value={dashboard.counts.scheduled_sessions} icon={CalendarClock} tone="dark" />
        <StatCard label="Realisees" value={dashboard.counts.completed_sessions} icon={UserRoundCheck} tone="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mes mentores</CardTitle>
            <CardDescription>Dossiers actifs et progression des seances.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard.assignments.length > 0 ? (
              dashboard.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{displayUser(assignment.mentoree_detail)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {assignment.completed_sessions_count}/{assignment.required_sessions ?? 0} seances realisees,{" "}
                      {assignment.remaining_sessions_count} restantes
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/mentor/mentees/${assignment.mentoree}`}>Ouvrir</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucun mentore actif pour le moment.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Periodes actives</CardTitle>
            <CardDescription>Cadre actuel defini par l&apos;administration.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard.active_periods.length > 0 ? (
              dashboard.active_periods.map((period) => (
                <div key={period.id} className="rounded-lg border border-border bg-muted/35 p-4">
                  <p className="font-semibold">{period.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(period.start_date)} - {formatDate(period.end_date)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {period.required_sessions} seance{period.required_sessions > 1 ? "s" : ""} obligatoire
                    {period.required_sessions > 1 ? "s" : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune periode active pour le moment.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
