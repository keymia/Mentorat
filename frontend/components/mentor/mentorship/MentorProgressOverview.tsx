"use client";

import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";
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
  const { page, setPage, pageCount, visibleItems: visibleRows } = usePagination(rows, 8);

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
    return <EmptyState icon={TrendingUp} title="Aucun suivi à afficher." />;
  }

  return (
    <ListTable
      title="Liste des suivis"
      countLabel={`${rows.length} suivi${rows.length > 1 ? "s" : ""}`}
      minWidth={920}
      footer={pageCount > 1 ? <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} /> : null}
      headers={[
        { label: "Mentoré" },
        { label: "Progression" },
        { label: "Avis" },
        { label: "Statut" },
        { label: "Actions", className: "text-right" },
      ]}
    >
      {visibleRows.map(({ assignment, progress }) => (
        <tr key={assignment.id} className="align-top">
          <td className="px-4 py-3 font-medium text-foreground">{displayUser(assignment.mentoree_detail)}</td>
          <td className="px-4 py-3 text-muted-foreground">{progress.progress_percentage ?? "Non renseignée"}%</td>
          <td className="px-4 py-3 text-muted-foreground">
            <p className="line-clamp-2 max-w-sm">{progress.mentor_opinion || "Aucun avis general"}</p>
          </td>
          <td className="px-4 py-3">
            <Badge variant={progress.progress_status === "difficulty" ? "outline" : "success"}>
              {progressStatusLabels[progress.progress_status]}
            </Badge>
          </td>
          <td className="px-4 py-3 text-right">
            <Button asChild variant="outline" size="sm">
              <Link href={`/mentor/mentees/${assignment.mentoree}`}>Mettre à jour</Link>
            </Button>
          </td>
        </tr>
      ))}
    </ListTable>
  );
}
