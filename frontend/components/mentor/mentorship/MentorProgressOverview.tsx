"use client";

import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MentoreeProgress,
  MentorshipAssignment,
  formatApiError,
  getMentorAssignmentProgress,
  getMentorAssignments,
} from "@/lib/api";
import { displayUser, progressStatusLabels } from "@/lib/mentorship";

type ProgressRow = {
  assignment: MentorshipAssignment;
  progress: MentoreeProgress;
};

export function MentorProgressOverview() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMentorAssignments()
      .then(async (assignments) => {
        const progressRows = await Promise.all(
          assignments.map(async (assignment) => ({
            assignment,
            progress: await getMentorAssignmentProgress(assignment.id),
          })),
        );
        if (isMounted) {
          setRows(progressRows);
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
    return <EmptyState icon={TrendingUp} title="Aucun suivi a afficher." />;
  }

  return (
    <div className="grid gap-3">
      {rows.map(({ assignment, progress }) => (
        <Card key={assignment.id}>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{displayUser(assignment.mentoree_detail)}</h2>
                  <Badge variant={progress.progress_status === "difficulty" ? "outline" : "success"}>
                    {progressStatusLabels[progress.progress_status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Progression: {progress.progress_percentage ?? "Non renseignee"}%
                </p>
                {progress.mentor_opinion ? <p className="mt-2 text-sm text-muted-foreground">Avis: {progress.mentor_opinion}</p> : null}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/mentor/mentees/${assignment.mentoree}`}>Mettre a jour</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
