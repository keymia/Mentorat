import type {
  MentoreeProgressStatus,
  MentorshipAssignmentStatus,
  MentorshipPeriodStatus,
  MentorshipSessionStatus,
  UtilisateurDetail,
} from "@/lib/api";

export const periodStatusLabels: Record<MentorshipPeriodStatus, string> = {
  draft: "Brouillon",
  active: "Active",
  completed: "Terminee",
  archived: "Archivee",
};

export const assignmentStatusLabels: Record<MentorshipAssignmentStatus, string> = {
  active: "Active",
  completed: "Terminee",
  suspended: "Suspendue",
};

export const sessionStatusLabels: Record<MentorshipSessionStatus, string> = {
  scheduled: "Programmee",
  completed: "Realisee",
  cancelled: "Annulee",
  postponed: "Reportee",
  absent: "Absente",
};

export const progressStatusLabels: Record<MentoreeProgressStatus, string> = {
  excellent: "Excellent",
  good: "Tres bon",
  average: "Bon",
  watch: "Moyen",
  difficulty: "En difficulte",
};

export function displayUser(user?: Pick<UtilisateurDetail, "prenom" | "nom" | "email"> | null) {
  if (!user) {
    return "Non renseigne";
  }
  const name = `${user.prenom ?? ""} ${user.nom ?? ""}`.trim();
  return name || "Non renseigne";
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "Non renseignee";
  }
  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Non renseignee";
  }
  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function normalizeTime(value?: string | null) {
  if (!value) {
    return "";
  }
  return value.slice(0, 5);
}
