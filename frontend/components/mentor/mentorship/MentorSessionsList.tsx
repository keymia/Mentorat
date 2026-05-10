"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MentorshipAssignment,
  MentorshipSession,
  formatApiError,
  getMentorAssignmentSessions,
  getMentorAssignments,
} from "@/lib/api";
import { displayUser, formatDate, normalizeTime, sessionStatusLabels } from "@/lib/mentorship";

type SessionRow = {
  assignment: MentorshipAssignment;
  session: MentorshipSession;
};

export function MentorSessionsList() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMentorAssignments()
      .then(async (assignments) => {
        const sessionGroups = await Promise.all(
          assignments.map(async (assignment) => ({
            assignment,
            sessions: await getMentorAssignmentSessions(assignment.id),
          })),
        );
        if (isMounted) {
          setRows(sessionGroups.flatMap((group) => group.sessions.map((session) => ({ assignment: group.assignment, session }))));
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

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (rows.length === 0) {
    return <EmptyState icon={CalendarClock} title="Aucune seance programmee." />;
  }

  return (
    <div className="grid gap-3">
      {rows.map(({ assignment, session }) => (
        <Card key={session.id}>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">Seance {session.session_number}</h2>
                  <Badge variant={session.status === "completed" ? "success" : "outline"}>
                    {sessionStatusLabels[session.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDate(session.scheduled_date)} {normalizeTime(session.start_time)}
                  {session.end_time ? ` - ${normalizeTime(session.end_time)}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{displayUser(assignment.mentoree_detail)}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/mentor/mentees/${assignment.mentoree}`}>Modifier</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
