"use client";

import { BarChart3, CalendarClock, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MentorshipAssignment,
  UtilisateurDetail,
  formatApiError,
  getMentorshipAssignments,
  getUsersByProfil,
} from "@/lib/api";
import { displayUser } from "@/lib/mentorship";

import { AdminMentorshipProgress } from "./AdminMentorshipProgress";
import { AdminMentorshipReports } from "./AdminMentorshipReports";
import { AdminMentorshipSessions } from "./AdminMentorshipSessions";

const sections = [
  { href: "#suivis", label: "Suivis", icon: TrendingUp },
  { href: "#seances", label: "Seances", icon: CalendarClock },
  { href: "#rapports", label: "Rapports", icon: BarChart3 },
];

const emptyFilters = {
  mentor: "",
  mentoree: "",
};

function uniqueMentees(assignments: MentorshipAssignment[]) {
  const menteeMap = new Map<number, UtilisateurDetail>();
  assignments.forEach((assignment) => {
    if (assignment.mentoree_detail) {
      menteeMap.set(assignment.mentoree, assignment.mentoree_detail);
    }
  });
  return Array.from(menteeMap.values()).sort((first, second) => displayUser(first).localeCompare(displayUser(second)));
}

export function AdminMentorshipFollowUpCenter() {
  const [mentors, setMentors] = useState<UtilisateurDetail[]>([]);
  const [mentees, setMentees] = useState<UtilisateurDetail[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [error, setError] = useState("");
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingMentees, setIsLoadingMentees] = useState(false);
  const menteeRequestRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    getUsersByProfil("MENTOR,MENTOR_ET_MENTORE")
      .then((mentorData) => {
        if (isMounted) {
          setMentors(mentorData.filter((mentor) => !mentor.niveau_academique_est_premier_niveau));
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
          setIsLoadingFilters(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const sharedFilters = {
    mentor: filters.mentor,
    mentoree: filters.mentoree,
  };
  const hasActiveFilter = Boolean(filters.mentor);

  async function handleMentorChange(mentor: string) {
    const requestId = menteeRequestRef.current + 1;
    menteeRequestRef.current = requestId;
    setFilters({ mentor, mentoree: "" });
    setMentees([]);

    if (!mentor) {
      setIsLoadingMentees(false);
      return;
    }

    setIsLoadingMentees(true);
    try {
      const assignments = await getMentorshipAssignments({ mentor });
      if (menteeRequestRef.current === requestId) {
        setMentees(uniqueMentees(assignments));
        setError("");
      }
    } catch (apiError) {
      if (menteeRequestRef.current === requestId) {
        setMentees([]);
        setError(formatApiError(apiError));
      }
    } finally {
      if (menteeRequestRef.current === requestId) {
        setIsLoadingMentees(false);
      }
    }
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Suivis mentorat</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Centralisez les suivis, les seances et les rapports de mentorat.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-card-foreground transition hover:-translate-y-0.5 hover:border-accent hover:bg-muted"
            >
              <section.icon className="size-4" aria-hidden="true" />
              {section.label}
            </a>
          ))}
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2">
          {isLoadingFilters ? <Skeleton className="h-24 md:col-span-2" /> : null}
          {!isLoadingFilters ? (
            <>
              <label>
                Mentor
                <select
                  className="field"
                  value={filters.mentor}
                  onChange={(event) => void handleMentorChange(event.target.value)}
                >
                  <option value="">Tous les mentors</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {displayUser(mentor)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Mentore
                <select
                  className="field"
                  value={filters.mentoree}
                  onChange={(event) => setFilters({ ...filters, mentoree: event.target.value })}
                  disabled={!filters.mentor || isLoadingMentees || mentees.length === 0}
                >
                  <option value="">
                    {isLoadingMentees
                      ? "Chargement..."
                      : filters.mentor
                        ? "Tous ses mentores"
                        : "Choisir un mentor d'abord"}
                  </option>
                  {mentees.map((mentee) => (
                    <option key={mentee.id} value={mentee.id}>
                      {displayUser(mentee)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </CardContent>
      </Card>

      {hasActiveFilter ? (
        <>
          <section id="suivis" className="scroll-mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Suivis des mentores</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Avis, difficultes, progres observes et recommandations.
              </p>
            </div>
            <AdminMentorshipProgress showHeader={false} showFilters={false} filters={sharedFilters} />
          </section>

          <section id="seances" className="scroll-mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Seances de mentorat</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Seances programmees, realisees, reportees ou annulees.
              </p>
            </div>
            <AdminMentorshipSessions showHeader={false} showFilters={false} filters={sharedFilters} />
          </section>

          <section id="rapports" className="scroll-mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Rapports mentorat</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Seances manquantes, affectations actives et alertes de progression.
              </p>
            </div>
            <AdminMentorshipReports showHeader={false} showFilters={false} filters={sharedFilters} />
          </section>
        </>
      ) : null}
    </div>
  );
}
