"use client";

import { UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MentorshipAssignment, formatApiError, getMentorMentees } from "@/lib/api";
import { displayUser, formatDate } from "@/lib/mentorship";

export function MentorMenteesList() {
  const [assignments, setAssignments] = useState<MentorshipAssignment[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMentorMentees()
      .then((data) => {
        if (isMounted) {
          setAssignments(data);
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

  if (assignments.length === 0) {
    return <EmptyState icon={UserRoundCheck} title="Aucun mentore actif pour le moment." />;
  }

  return (
    <div className="grid gap-3">
      {assignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{displayUser(assignment.mentoree_detail)}</h2>
                  <Badge variant="success">{assignment.period_detail?.title ?? "Periode active"}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDate(assignment.period_detail?.start_date)} - {formatDate(assignment.period_detail?.end_date)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {assignment.completed_sessions_count}/{assignment.required_sessions ?? 0} realisees,{" "}
                  {assignment.scheduled_sessions_count} programmees, {assignment.remaining_sessions_count} restantes
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/mentor/mentees/${assignment.mentoree}`}>Voir le dossier</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
