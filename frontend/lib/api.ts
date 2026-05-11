export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export type NiveauAcademique = {
  id: number;
  nom: string;
  ordre_niveau: number;
  est_premier_niveau: boolean;
  est_dernier_niveau: boolean;
};

export type Role = {
  id: number;
  nom: string;
  description: string;
};

export type MentorDisponible = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  langue_preferee: "FR" | "EN";
  region: string;
  niveau_academique: number;
  niveau_academique_nom: string;
  niveau_academique_est_premier_niveau?: boolean;
  disponibilite: string;
  objectifs: string;
  capacite_mentorat: number;
  nombre_mentores_actuels: number;
  capacite_restante: number;
};

export type Partenaire = {
  id: number;
  nom_partenaire: string;
  description: string;
  logo: string | null;
  site_web: string;
  type_partenaire: string;
  ordre_affichage: number;
  statut: string;
  date_ajout: string;
};

export type DashboardStats = {
  total_mentors: number;
  total_mentores: number;
  inscriptions_en_attente: number;
  jumelages_actifs: number;
  mentors_disponibles: number;
  mentors_satures: number;
  evenements_a_venir: number;
  partenaires_actifs: number;
};

export type ParametreSysteme = {
  id: number;
  cle: string;
  valeur: string;
  description: string;
};

export type Evenement = {
  id: number;
  titre: string;
  description: string;
  date_evenement: string;
  heure_evenement: string;
  lieu: string;
  image: string | null;
  video: string | null;
  type_evenement: string;
  statut_evenement: string;
};

export type UtilisateurDetail = MentorDisponible & {
  role?: number;
  role_nom?: string;
  profil_mentorat?: "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE" | null;
  statut_compte?: string;
  is_active?: boolean;
};

export type UtilisateurPayload = {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  mot_de_passe?: string;
  langue_preferee?: "FR" | "EN";
  region?: string;
  objectifs?: string;
  profil_mentorat?: "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE" | "";
  capacite_mentorat?: number;
  statut_compte?: string;
  role?: number | null;
  niveau_academique?: number | null;
  is_active?: boolean;
};

export type MentorshipPeriodStatus = "draft" | "active" | "completed" | "archived";

export type MentorshipPeriod = {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  required_sessions: number;
  status: MentorshipPeriodStatus;
  assignments_count?: number;
  sessions_count?: number;
  completed_sessions_count?: number;
  created_at: string;
  updated_at: string;
};

export type MentorshipAssignmentStatus = "active" | "completed" | "suspended";

export type MentorshipAssignment = {
  id: number;
  mentor: number;
  mentor_detail?: UtilisateurDetail;
  mentoree: number;
  mentoree_detail?: UtilisateurDetail;
  period: number;
  period_detail?: MentorshipPeriod;
  required_sessions?: number;
  status: MentorshipAssignmentStatus;
  admin_notes: string;
  scheduled_sessions_count: number;
  completed_sessions_count: number;
  remaining_sessions_count: number;
  missing_sessions_count: number;
  assigned_at: string;
  created_at: string;
  updated_at: string;
};

export type MentorshipSessionStatus = "scheduled" | "completed" | "cancelled" | "postponed" | "absent";

export type MentorshipSession = {
  id: number;
  assignment: number;
  mentor_detail?: UtilisateurDetail;
  mentoree_detail?: UtilisateurDetail;
  period_detail?: MentorshipPeriod;
  session_number: number;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  status: MentorshipSessionStatus;
  summary: string;
  mentor_comment: string;
  created_at: string;
  updated_at: string;
};

export type MentoreeProgressStatus = "excellent" | "good" | "average" | "watch" | "difficulty";

export type MentoreeProgress = {
  id: number;
  assignment: number;
  mentor_detail?: UtilisateurDetail;
  mentoree_detail?: UtilisateurDetail;
  period_detail?: MentorshipPeriod;
  progress_status: MentoreeProgressStatus;
  progress_percentage: number | null;
  difficulties: string;
  achievements: string;
  recommendations: string;
  mentor_opinion: string;
  updated_at: string;
};

export type MentorDashboard = {
  mentor: UtilisateurDetail;
  active_periods: MentorshipPeriod[];
  counts: {
    mentees: number;
    assignments: number;
    required_sessions: number;
    scheduled_sessions: number;
    completed_sessions: number;
    remaining_sessions: number;
    missing_sessions: number;
  };
  assignments: MentorshipAssignment[];
};

export type MentorMenteeDetail = {
  mentee: UtilisateurDetail;
  assignments: MentorshipAssignment[];
  current_assignment: MentorshipAssignment;
  sessions: MentorshipSession[];
  progress: MentoreeProgress | null;
};

export type AdminMentorshipOverview = {
  periods: {
    total: number;
    active: number;
    active_items: MentorshipPeriod[];
  };
  assignments: {
    total: number;
    active: number;
    completed: number;
    suspended: number;
  };
  sessions: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    postponed: number;
    absent: number;
  };
  progress: {
    total: number;
    watch: number;
    difficulty: number;
  };
};

export type AdminMentorshipReportRow = {
  assignment: MentorshipAssignment;
  required_sessions: number;
  scheduled_sessions: number;
  completed_sessions: number;
  missing_sessions: number;
  remaining_sessions: number;
};

export type AdminMentorshipReport = {
  summary: {
    assignments: number;
    missing_sessions: number;
  };
  results: AdminMentorshipReportRow[];
};

export type MentorshipFilters = {
  period?: string;
  mentor?: string;
  mentoree?: string;
  status?: string;
  progress_status?: string;
};

type ApiOptions = RequestInit & {
  auth?: boolean;
  token?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload: unknown,
  ) {
    super(message);
  }
}

function getBrowserToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("mentorat_access");
}

function clearBrowserAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("mentorat_access");
  window.localStorage.removeItem("mentorat_refresh");
  document.cookie = "mentorat_access=; path=/; max-age=0; SameSite=Lax";
}

function toApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function readPayload(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }
  if (payload && typeof payload === "object" && "detail" in payload) {
    return String((payload as { detail: unknown }).detail);
  }
  return "La requete API a echoue.";
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const shouldAuthenticate = options.auth ?? true;
  const token = shouldAuthenticate ? (options.token ?? getBrowserToken()) : null;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(toApiUrl(path), {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });

  const payload = await readPayload(response);
  if (!response.ok) {
    if (
      response.status === 401 &&
      payload &&
      typeof payload === "object" &&
      "code" in payload &&
      (payload as { code: unknown }).code === "token_not_valid"
    ) {
      clearBrowserAuth();
    }
    throw new ApiError(errorMessage(payload), response.status, payload);
  }

  return payload as T;
}

export function formatApiError(error: unknown) {
  function formatValue(value: unknown): string {
    if (Array.isArray(value)) {
      return value.map(formatValue).join(", ");
    }
    if (value && typeof value === "object") {
      return Object.entries(value as Record<string, unknown>)
        .map(([key, nestedValue]) => `${key}: ${formatValue(nestedValue)}`)
        .join(", ");
    }
    return String(value);
  }

  if (error instanceof ApiError) {
    if (error.payload && typeof error.payload === "object") {
      return Object.entries(error.payload as Record<string, unknown>)
        .map(([key, value]) => `${key}: ${formatValue(value)}`)
        .join(" | ");
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Une erreur inconnue est survenue.";
}

export function login(email: string, mot_de_passe: string) {
  return apiFetch<{
    access: string;
    refresh: string;
    user: Record<string, unknown>;
  }>("/auth/login/", {
    auth: false,
    method: "POST",
    body: JSON.stringify({ email, mot_de_passe }),
  });
}

export function updateOwnPassword(motDePasse: string) {
  return apiFetch<{ detail: string }>("/auth/password/", {
    method: "POST",
    body: JSON.stringify({ mot_de_passe: motDePasse }),
  });
}

export function getCurrentUser() {
  return apiFetch<UtilisateurDetail>("/auth/me/");
}

export function updateOwnProfile(payload: Pick<UtilisateurPayload, "nom" | "prenom" | "email" | "telephone" | "langue_preferee" | "region" | "objectifs">) {
  return apiFetch<UtilisateurDetail>("/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getNiveaux() {
  return apiFetch<NiveauAcademique[]>("/niveaux/", { auth: false });
}

export function getRoles() {
  return apiFetch<Role[]>("/roles/");
}

export function getMentorsDisponibles(niveauId: number, periodId?: number | string) {
  const params = new URLSearchParams({ niveau_id: String(niveauId) });
  if (periodId) {
    params.set("period_id", String(periodId));
  }
  return apiFetch<MentorDisponible[]>(`/mentors/disponibles/?${params.toString()}`, { auth: false });
}

export function createMentorInscription(payload: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/inscriptions/mentor/", {
    auth: false,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createMentoreInscription(payload: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/inscriptions/mentore/", {
    auth: false,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPublicPartenaires() {
  return apiFetch<Partenaire[]>("/partenaires/public/", { auth: false });
}

export function getAdminPartenaires() {
  return apiFetch<Partenaire[]>("/partenaires/");
}

export function createPartenaire(payload: FormData) {
  return apiFetch<Partenaire>("/partenaires/", {
    method: "POST",
    body: payload,
  });
}

export function updatePartenaire(id: number, payload: FormData | Partial<Partenaire>) {
  return apiFetch<Partenaire>(`/partenaires/${id}/`, {
    method: "PATCH",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function deletePartenaire(id: number) {
  return apiFetch<null>(`/partenaires/${id}/`, {
    method: "DELETE",
  });
}

export function getDashboardStats() {
  return apiFetch<DashboardStats>("/statistiques/dashboard/");
}

export function getAdminCollection(endpoint: string) {
  return apiFetch<Record<string, unknown>[] | { results?: Record<string, unknown>[] }>(endpoint);
}

function toQueryString(filters: MentorshipFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getUsersByProfil(profilMentorat: string) {
  return apiFetch<UtilisateurDetail[]>(`/users/?profil_mentorat=${profilMentorat}`);
}

export function createUtilisateur(payload: UtilisateurPayload) {
  return apiFetch<UtilisateurDetail>("/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUtilisateur(id: number, payload: UtilisateurPayload) {
  return apiFetch<UtilisateurDetail>(`/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getMentorshipPeriods() {
  return apiFetch<MentorshipPeriod[]>("/mentorship-periods/");
}

export function getAvailableMentorshipPeriods() {
  return apiFetch<MentorshipPeriod[]>("/mentorship-periods/available/", { auth: false });
}

export function createMentorshipPeriod(
  payload: Pick<MentorshipPeriod, "title" | "description" | "start_date" | "end_date" | "required_sessions" | "status">,
) {
  return apiFetch<MentorshipPeriod>("/mentorship-periods/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMentorshipPeriod(id: number, payload: Partial<MentorshipPeriod>) {
  return apiFetch<MentorshipPeriod>(`/mentorship-periods/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteMentorshipPeriod(id: number) {
  return apiFetch<null>(`/mentorship-periods/${id}/`, {
    method: "DELETE",
  });
}

export function getMentorshipAssignments(filters: MentorshipFilters = {}) {
  return apiFetch<MentorshipAssignment[]>(`/mentorship-assignments/${toQueryString(filters)}`);
}

export function createMentorshipAssignment(
  payload: Pick<MentorshipAssignment, "mentor" | "mentoree" | "period" | "status" | "admin_notes">,
) {
  return apiFetch<MentorshipAssignment>("/mentorship-assignments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMentorshipAssignment(id: number, payload: Partial<MentorshipAssignment>) {
  return apiFetch<MentorshipAssignment>(`/mentorship-assignments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAdminMentorshipOverview(filters: MentorshipFilters = {}) {
  return apiFetch<AdminMentorshipOverview>(`/admin/mentorship-overview/${toQueryString(filters)}`);
}

export function getAdminMentorshipSessions(filters: MentorshipFilters = {}) {
  return apiFetch<MentorshipSession[]>(`/admin/mentorship-sessions/${toQueryString(filters)}`);
}

export function getAdminMentorshipProgress(filters: MentorshipFilters = {}) {
  return apiFetch<MentoreeProgress[]>(`/admin/mentorship-progress/${toQueryString(filters)}`);
}

export function getAdminMentorshipReports(filters: MentorshipFilters = {}) {
  return apiFetch<AdminMentorshipReport>(`/admin/mentorship-reports/${toQueryString(filters)}`);
}

export function getMentorDashboard() {
  return apiFetch<MentorDashboard>("/mentor/dashboard/");
}

export function getMentorMentees() {
  return apiFetch<MentorshipAssignment[]>("/mentor/mentees/");
}

export function getMentorMenteeDetail(id: number) {
  return apiFetch<MentorMenteeDetail>(`/mentor/mentees/${id}/`);
}

export function getMentorAssignments() {
  return apiFetch<MentorshipAssignment[]>("/mentor/assignments/");
}

export function getMentorAssignmentSessions(assignmentId: number) {
  return apiFetch<MentorshipSession[]>(`/mentor/assignments/${assignmentId}/sessions/`);
}

export function createMentorAssignmentSession(
  assignmentId: number,
  payload: Pick<MentorshipSession, "session_number" | "scheduled_date" | "start_time" | "end_time" | "status" | "summary" | "mentor_comment">,
) {
  return apiFetch<MentorshipSession>(`/mentor/assignments/${assignmentId}/sessions/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMentorSession(id: number, payload: Partial<MentorshipSession>) {
  return apiFetch<MentorshipSession>(`/mentor/sessions/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function completeMentorSession(id: number, payload: Partial<MentorshipSession>) {
  return apiFetch<MentorshipSession>(`/mentor/sessions/${id}/complete/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getMentorAssignmentProgress(assignmentId: number) {
  return apiFetch<MentoreeProgress>(`/mentor/assignments/${assignmentId}/progress/`);
}

export function updateMentorAssignmentProgress(assignmentId: number, payload: Partial<MentoreeProgress>) {
  return apiFetch<MentoreeProgress>(`/mentor/assignments/${assignmentId}/progress/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function continueMentorAssignment(assignmentId: number, period: number) {
  return apiFetch<MentorshipAssignment>(`/mentor/assignments/${assignmentId}/continue/`, {
    method: "POST",
    body: JSON.stringify({ period }),
  });
}

export function validerInscription(id: number) {
  return apiFetch<Record<string, unknown>>(`/inscriptions/${id}/valider/`, {
    method: "PUT",
  });
}

export function refuserInscription(id: number) {
  return apiFetch<Record<string, unknown>>(`/inscriptions/${id}/refuser/`, {
    method: "PUT",
  });
}

export function getParametres() {
  return apiFetch<ParametreSysteme[]>("/parametres/");
}

export function updateParametre(id: number, payload: Pick<ParametreSysteme, "valeur" | "description">) {
  return apiFetch<ParametreSysteme>(`/parametres/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getEvenements() {
  return apiFetch<Evenement[]>("/evenements/");
}

export function getPublicEvenements() {
  return apiFetch<Evenement[]>("/evenements/public/", { auth: false });
}

export function createEvenement(payload: FormData | Omit<Evenement, "id">) {
  return apiFetch<Evenement>("/evenements/", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function updateEvenement(id: number, payload: FormData | Partial<Omit<Evenement, "id">>) {
  return apiFetch<Evenement>(`/evenements/${id}/`, {
    method: "PATCH",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function deleteEvenement(id: number) {
  return apiFetch<null>(`/evenements/${id}/`, {
    method: "DELETE",
  });
}
