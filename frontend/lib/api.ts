export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export type NiveauAcademique = {
  id: number;
  nom: string;
  code?: string | null;
  ordre_niveau: number;
  est_premier_niveau: boolean;
  est_dernier_niveau: boolean;
};

export const mentorAcademicLevelOrders = [2, 3, 4];
export const mentoreeAcademicLevelOrders = [1, 2, 3];

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
  mini_bio?: string;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  domaine_specialite?: string;
  wants_to_appear_on_team_page?: boolean;
  is_team_approved?: boolean;
  team_display_order?: number;
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
  role_label?: string;
  profil_mentorat?: "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE" | null;
  statut_compte?: string;
  is_active?: boolean;
  date_creation?: string;
  can_appear_on_about_page?: boolean;
  public_appellation?: string;
  public_title?: string;
  public_description?: string;
  public_photo?: string | null;
  public_photo_url?: string | null;
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
  mini_bio?: string;
  profile_photo?: File | string | null;
  domaine_specialite?: string;
  wants_to_appear_on_team_page?: boolean;
  is_team_approved?: boolean;
  team_display_order?: number;
  can_appear_on_about_page?: boolean;
  public_appellation?: string;
  public_title?: string;
  public_description?: string;
  public_photo?: File | string | null;
  profil_mentorat?: "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE" | "";
  capacite_mentorat?: number;
  statut_compte?: string;
  role?: number | null;
  niveau_academique?: number | null;
  is_active?: boolean;
};

export type TeamMember = {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  mini_bio: string;
  profile_photo_url: string | null;
  academic_level?: string;
  niveau_academique_nom?: string;
  domaine_specialite: string;
  team_display_order: number;
};

export type AdminTeamMember = TeamMember & {
  email: string;
  niveau_academique: number | null;
  wants_to_appear_on_team_page: boolean;
  is_team_approved: boolean;
};

export type PublicAboutTeamMember = {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  public_appellation: string;
  public_display_name: string;
  role_label: string;
  public_title: string;
  public_description: string;
  public_photo_url: string | null;
};

export type OperationalAdmin = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  langue_preferee: "FR" | "EN";
  region: string;
  statut_compte: string;
  is_active: boolean;
  role?: number;
  role_nom?: string;
  can_appear_on_about_page: boolean;
  public_appellation: string;
  public_title: string;
  public_description: string;
  public_photo: string | null;
  public_photo_url: string | null;
  is_public_profile_approved: boolean;
  pending_public_validation: boolean;
  public_profile_status: "NON_SOUMIS" | "EN_ATTENTE" | "VALIDE" | "REFUSE";
  public_profile_updated_at: string | null;
  approved_public_appellation: string;
  approved_public_prenom: string;
  approved_public_nom: string;
  approved_public_title: string;
  approved_public_description: string;
  approved_public_photo_url: string | null;
  date_creation: string;
};

export type AccountProfile = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role_nom?: string;
  role_label?: string;
  statut_compte: string;
  date_creation: string;
  profile_photo_url: string | null;
  can_appear_on_about_page: boolean;
  public_appellation: string;
  public_title: string;
  public_description: string;
  public_photo: string | null;
  public_photo_url: string | null;
  is_public_profile_approved: boolean;
  pending_public_validation: boolean;
  public_profile_status: "NON_SOUMIS" | "EN_ATTENTE" | "VALIDE" | "REFUSE";
  public_profile_updated_at: string | null;
};

export type MentorRegistrationConfig = {
  max_mentees_per_mentor: number;
  mentee_capacity: number;
};

export type Inscription = {
  id: number;
  utilisateur: number;
  utilisateur_detail?: UtilisateurDetail;
  type_inscription: "MENTOR" | "MENTORE";
  statut_inscription: "EN_ATTENTE" | "VALIDEE" | "REFUSEE";
  consentement: boolean;
  date_inscription: string;
  mentor_choisi?: number | null;
  mentor_choisi_detail?: UtilisateurDetail | null;
  mentorship_period?: number | null;
  mentorship_period_title?: string | null;
  wants_association_assignment: boolean;
  needs_matching: boolean;
  registration_status: "registered" | "pending_matching" | "matched" | "completed";
  completed_session_status: "none" | "completed";
};

export type AdminMatchingStatus =
  | "assigned"
  | "pending_matching"
  | "association_choice"
  | "unassigned"
  | "completed";

export type AdminMatchingRow = {
  inscription: Inscription;
  mentee: UtilisateurDetail;
  period: MentorshipPeriod | null;
  current_mentor?: UtilisateurDetail | null;
  current_assignment?: MentorshipAssignment | null;
  assignment_history?: MentorshipAssignment[];
  compatible_mentors: UtilisateurDetail[];
  matching_status: AdminMatchingStatus;
  needs_matching?: boolean;
  wants_association_assignment?: boolean;
};

export type AdminMatchingResponse = {
  periods: MentorshipPeriod[];
  selected_period: MentorshipPeriod | null;
  show_session_filter: boolean;
  results: AdminMatchingRow[];
};

export type AdminActionAlerts = {
  pending_matching_count: number;
  pending_registration_count: number;
  pending_public_admin_count: number;
  session_ending_soon: boolean;
  days_before_session_end: number | null;
  active_session: {
    id: number;
    title: string;
    end_date: string;
  } | null;
};

export type MentorshipPeriodStatus = "draft" | "active" | "completed" | "archived";

export type MentorshipPeriod = {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  required_sessions: number;
  max_mentees_per_mentor: number;
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
  progress_status: MentoreeProgressStatus;
  progress_percentage: number;
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
  global_progress: number;
  last_sessions: MentorshipSession[];
  mentees_needing_follow_up: MentorshipAssignment[];
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

export function clearBrowserAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("mentorat_access");
  window.localStorage.removeItem("mentorat_refresh");
  document.cookie = "mentorat_access=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "mentorat_home=; path=/; max-age=0; SameSite=Lax";
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

function filenameFromContentDisposition(disposition: string | null, fallback: string) {
  if (!disposition) {
    return fallback;
  }
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim());
  }
  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1]?.trim() || fallback;
}

export async function apiDownload(path: string, fallbackFilename: string): Promise<{ blob: Blob; filename: string }> {
  const headers = new Headers();
  const token = getBrowserToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(toApiUrl(path), {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await readPayload(response);
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

  return {
    blob: await response.blob(),
    filename: filenameFromContentDisposition(response.headers.get("Content-Disposition"), fallbackFilename),
  };
}

const apiFieldLabels: Record<string, string> = {
  email: "Email",
  mot_de_passe: "Mot de passe",
  ancien_mot_de_passe: "Ancien mot de passe",
  code: "Code temporaire",
  prenom: "Prénom",
  nom: "Nom",
  telephone: "Téléphone",
  niveau_academique: "Niveau académique",
  mentor_choisi: "Mentor",
  session_number: "Numéro de séance",
  scheduled_date: "Date",
  start_time: "Heure de début",
  end_time: "Heure de fin",
  public_title: "Titre public",
  public_description: "Description publique",
  mini_bio: "Mini bio",
  consentement: "Consentement",
  detail: "",
  non_field_errors: "",
};

function friendlyFieldLabel(key: string) {
  return apiFieldLabels[key] ?? key.replace(/_/g, " ");
}

function normalizeApiMessage(value: string) {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "identifiants invalides.") {
    return "Identifiants invalides. Vérifiez votre email et votre mot de passe.";
  }
  if (lower === "compte inactif ou en attente de validation.") {
    return "Ce compte n'est pas autorisé à se connecter pour le moment.";
  }
  if (lower === "code invalide ou expire.") {
    return "Le code temporaire est invalide ou expiré.";
  }
  if (lower.includes("server") && lower.includes("error")) {
    return "Le serveur a rencontré un problème. Réessayez dans un instant.";
  }
  return trimmed;
}

function formatApiValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => formatApiValue(item)).join(", ");
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nestedValue]) => formatApiEntry(key, nestedValue))
      .join(" | ");
  }
  return normalizeApiMessage(String(value));
}

function formatApiEntry(key: string, value: unknown) {
  const label = friendlyFieldLabel(key);
  const formattedValue = formatApiValue(value);
  return label ? `${label} : ${formattedValue}` : formattedValue;
}

export function formatApiError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.payload && typeof error.payload === "object") {
      return Object.entries(error.payload as Record<string, unknown>)
        .map(([key, value]) => formatApiEntry(key, value))
        .join(" | ");
    }
    if (error.status >= 500) {
      return "Le serveur a rencontré un problème. Réessayez dans un instant.";
    }
    return normalizeApiMessage(error.message);
  }
  if (error instanceof Error) {
    return normalizeApiMessage(error.message);
  }
  return "Une erreur inconnue est survenue.";
}

export type AuthSuccessResponse = {
  access: string;
  refresh: string;
  user: Record<string, unknown>;
};

export type LoginChallengeResponse = {
  requires_2fa: true;
  challenge_id: string;
  email: string;
  expires_in_minutes: number;
};

export type LoginResponse = AuthSuccessResponse | LoginChallengeResponse;

export function login(email: string, mot_de_passe: string) {
  return apiFetch<LoginResponse>("/auth/login/", {
    auth: false,
    method: "POST",
    body: JSON.stringify({ email, mot_de_passe }),
  });
}

export function verifyLoginCode(challengeId: string, code: string) {
  return apiFetch<AuthSuccessResponse>("/auth/login/verify-code/", {
    auth: false,
    method: "POST",
    body: JSON.stringify({ challenge_id: challengeId, code }),
  });
}

export function updateOwnPassword(ancienMotDePasse: string, motDePasse: string) {
  return apiFetch<{ detail: string }>("/auth/password/", {
    method: "POST",
    body: JSON.stringify({ ancien_mot_de_passe: ancienMotDePasse, mot_de_passe: motDePasse }),
  });
}

export function getCurrentUser() {
  return apiFetch<UtilisateurDetail>("/auth/me/");
}

export function getAccountMe() {
  return apiFetch<AccountProfile>("/account/me/");
}

export function updateAccountMe(payload: FormData | Partial<AccountProfile>) {
  return apiFetch<AccountProfile>("/account/me/", {
    method: "PATCH",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function updateOwnProfile(payload: Partial<Pick<UtilisateurPayload, "nom" | "prenom" | "email" | "telephone" | "langue_preferee" | "region" | "objectifs">>) {
  return apiFetch<UtilisateurDetail>("/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getMentorProfile() {
  return apiFetch<UtilisateurDetail>("/mentor/profile/");
}

export function updateMentorProfile(payload: FormData | Partial<UtilisateurPayload>) {
  return apiFetch<UtilisateurDetail>("/mentor/profile/", {
    method: "PATCH",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
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

export function getPublicAvailableMentors(niveauId: number, periodId?: number | string) {
  const params = new URLSearchParams({ niveau_id: String(niveauId) });
  if (periodId) {
    params.set("period_id", String(periodId));
  }
  return apiFetch<MentorDisponible[]>(`/public/available-mentors/?${params.toString()}`, { auth: false });
}

export function getMentorRegistrationConfig() {
  return apiFetch<MentorRegistrationConfig>("/public/mentor-registration-config/", { auth: false });
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

export function getPublicTeam() {
  return apiFetch<TeamMember[]>("/public/team/", { auth: false });
}

export function getPublicAboutTeam() {
  return apiFetch<PublicAboutTeamMember[]>("/public/about-team/", { auth: false });
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

export function getAdminTeamMembers() {
  return apiFetch<AdminTeamMember[]>("/admin/team-members/");
}

export function updateAdminTeamMember(id: number, payload: Pick<AdminTeamMember, "is_team_approved" | "team_display_order">) {
  return apiFetch<AdminTeamMember>(`/admin/team-members/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAdminRegistrations(filters: { search?: string; role?: string; status?: string; ordering?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return apiFetch<Inscription[]>(`/admin/registrations/${query ? `?${query}` : ""}`);
}

export function getAdminActionAlerts() {
  return apiFetch<AdminActionAlerts>("/admin/action-alerts/");
}

export function getAdminMatching(period?: string) {
  const query = period ? `?period=${encodeURIComponent(period)}` : "";
  return apiFetch<AdminMatchingResponse>(`/admin/matching/${query}`);
}

export function getAdminMatchingDetails(menteeId: number, period?: string | number) {
  const query = period ? `?period=${encodeURIComponent(String(period))}` : "";
  return apiFetch<AdminMatchingRow>(`/admin/matching/${menteeId}/details/${query}`);
}

export function assignAdminMatching(menteeId: number, payload: { mentor: number; period: number }) {
  return apiFetch<MentorshipAssignment>(`/admin/matching/${menteeId}/assign/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reassignAdminMatching(
  menteeId: number,
  payload: { new_mentor_id: number; session_id: number },
) {
  return apiFetch<AdminMatchingRow>(`/admin/matching/${menteeId}/reassign/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOperationalAdmins() {
  return apiFetch<OperationalAdmin[]>("/admin/operational-admins/");
}

export function createOperationalAdmin(payload: FormData | Record<string, unknown>) {
  return apiFetch<OperationalAdmin>("/admin/operational-admins/", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function updateOperationalAdmin(id: number, payload: FormData | Record<string, unknown>) {
  return apiFetch<OperationalAdmin>(`/admin/operational-admins/${id}/`, {
    method: "PATCH",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function approveOperationalAdminPublicProfile(id: number) {
  return apiFetch<OperationalAdmin>(`/admin/operational-admins/${id}/approve-public-profile/`, {
    method: "PATCH",
  });
}

export function rejectOperationalAdminPublicProfile(id: number) {
  return apiFetch<OperationalAdmin>(`/admin/operational-admins/${id}/reject-public-profile/`, {
    method: "PATCH",
  });
}

export function deleteOperationalAdmin(id: number) {
  return apiFetch<null>(`/admin/operational-admins/${id}/`, {
    method: "DELETE",
  });
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

export function getAdminSessions() {
  return apiFetch<MentorshipPeriod[]>("/admin/sessions/");
}

export function getAvailableMentorshipPeriods() {
  return apiFetch<MentorshipPeriod[]>("/mentorship-periods/available/", { auth: false });
}

export function createMentorshipPeriod(
  payload: Pick<
    MentorshipPeriod,
    "title" | "description" | "start_date" | "end_date" | "required_sessions" | "max_mentees_per_mentor" | "status"
  >,
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

export function exportMentorshipPeriod(id: number, format: "excel" | "csv") {
  return apiDownload(`/admin/mentorship-periods/${id}/export/${format}/`, `periode_${id}.${format === "excel" ? "xlsx" : "csv"}`);
}

export function completeAdminSession(id: number) {
  return apiFetch<MentorshipPeriod>(`/admin/sessions/${id}/complete/`, {
    method: "PATCH",
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

export function getMentorSessions() {
  return apiFetch<MentorshipSession[]>("/mentor/sessions/");
}

export function createMentorAssignmentSession(
  assignmentId: number,
  payload: Pick<MentorshipSession, "scheduled_date" | "start_time" | "end_time" | "status" | "summary" | "mentor_comment"> & {
    session_number?: number;
  },
) {
  return apiFetch<MentorshipSession>(`/mentor/assignments/${assignmentId}/sessions/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createMentorSession(
  payload: Pick<MentorshipSession, "scheduled_date" | "start_time" | "end_time" | "summary"> & {
    assignment?: number;
    mentoree?: number;
    mentor_comment?: string;
    session_number?: number;
    status?: MentorshipSessionStatus;
  },
) {
  return apiFetch<MentorshipSession>("/mentor/sessions/", {
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

export function getMentorFollowUps() {
  return apiFetch<MentorshipSession[]>("/mentor/follow-ups/");
}

export function updateMentorFollowUp(
  id: number,
  payload: {
    progress_status: MentoreeProgressStatus;
    appreciation: string;
    observation?: string;
    recommendations?: string;
    summary?: string;
  },
) {
  return apiFetch<{ session: MentorshipSession; progress: MentoreeProgress }>(`/mentor/follow-ups/${id}/`, {
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
