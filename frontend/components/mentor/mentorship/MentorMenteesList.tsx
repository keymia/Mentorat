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
import { formatDate, progressStatusLabels } from "@/lib/mentorship";

function displayName(assignment: MentorshipAssignment) {
  const user = assignment.mentoree_detail;
  if (!user) {
    return "Mentore non renseigne";
  }
  const name = `${user.prenom ?? ""} ${user.nom ?? ""}`.trim();
  return name || "Mentore non renseigne";
}

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
            <div className="grid gap-4 xl:grid-cols-[1.05fr_1.55fr_auto] xl:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{displayName(assignment)}</h2>
                  <Badge variant={assignment.progress_status === "difficulty" ? "outline" : "success"}>
                    {progressStatusLabels[assignment.progress_status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {assignment.mentoree_detail?.niveau_academique_nom ?? "Niveau non renseigne"}
                </p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <p>
                  <span className="block text-muted-foreground">Periode</span>
                  <span className="font-semibold text-foreground">{assignment.period_detail?.title ?? "Active"}</span>
                </p>
                <p>
                  <span className="block text-muted-foreground">Prevues</span>
                  <span className="font-semibold text-foreground">{assignment.required_sessions ?? 0}</span>
                </p>
                <p>
                  <span className="block text-muted-foreground">Realisees</span>
                  <span className="font-semibold text-foreground">{assignment.completed_sessions_count}</span>
                </p>
                <p>
                  <span className="block text-muted-foreground">Restantes</span>
                  <span className="font-semibold text-foreground">{assignment.remaining_sessions_count}</span>
                </p>
                <p>
                  <span className="block text-muted-foreground">Avancement</span>
                  <span className="font-semibold text-foreground">{assignment.progress_percentage}%</span>
                </p>
                <p className="text-muted-foreground sm:col-span-2 lg:col-span-5">
                  {formatDate(assignment.period_detail?.start_date)} - {formatDate(assignment.period_detail?.end_date)}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="w-fit xl:justify-self-end">
                <Link href={`/mentor/mentees/${assignment.mentoree}`}>Voir le dossier</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
