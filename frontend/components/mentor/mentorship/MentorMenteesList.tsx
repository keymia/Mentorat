"use client";

import { UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
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
    <ListTable
      title="Liste des mentores"
      countLabel={`${assignments.length} mentore${assignments.length > 1 ? "s" : ""}`}
      minWidth={1040}
      headers={[
        { label: "Mentore" },
        { label: "Periode" },
        { label: "Seances" },
        { label: "Avancement" },
        { label: "Statut" },
        { label: "Actions", className: "text-right" },
      ]}
    >
      {assignments.map((assignment) => (
        <tr key={assignment.id} className="align-top">
          <td className="px-4 py-3">
            <p className="font-medium text-foreground">{displayName(assignment)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {assignment.mentoree_detail?.niveau_academique_nom ?? "Niveau non renseigne"}
            </p>
          </td>
          <td className="px-4 py-3 text-muted-foreground">
            <p className="font-medium text-foreground">{assignment.period_detail?.title ?? "Active"}</p>
            <p className="mt-1 text-xs">
              {formatDate(assignment.period_detail?.start_date)} - {formatDate(assignment.period_detail?.end_date)}
            </p>
          </td>
          <td className="px-4 py-3 text-muted-foreground">
            <p>{assignment.completed_sessions_count}/{assignment.required_sessions ?? 0} realisees</p>
            <p className="mt-1 text-xs">{assignment.remaining_sessions_count} restantes</p>
          </td>
          <td className="px-4 py-3 font-medium text-foreground">{assignment.progress_percentage}%</td>
          <td className="px-4 py-3">
            <Badge variant={assignment.progress_status === "difficulty" ? "outline" : "success"}>
              {progressStatusLabels[assignment.progress_status]}
            </Badge>
          </td>
          <td className="px-4 py-3 text-right">
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href={`/mentor/mentees/${assignment.mentoree}`}>Voir le dossier</Link>
            </Button>
          </td>
        </tr>
      ))}
    </ListTable>
  );
}
