export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export type NiveauAcademique = {
  id: number;
  nom: string;
  ordre_niveau: number;
  est_premier_niveau: boolean;
  est_dernier_niveau: boolean;
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

export type MentorProfile = {
  id: number;
  mentor: number;
  max_mentores: number;
  max_sessions_per_week: number;
  default_session_duration: 30 | 45 | 60 | 90;
  date_creation: string;
  date_modification: string;
};

export type MentorAvailability = {
  id: number;
  mentor: number;
  weekday: number;
  weekday_label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  date_creation: string;
  date_modification: string;
};

export type MentorAvailabilityException = {
  id: number;
  mentor: number;
  start_date: string;
  end_date: string;
  reason: string;
  date_creation: string;
};

export type AvailableSlot = {
  mentor: number;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
};

export type SessionBooking = {
  id: number;
  mentor: number;
  mentor_detail?: MentorDisponible;
  mentore: number;
  mentore_detail?: MentorDisponible;
  starts_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
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

export function getNiveaux() {
  return apiFetch<NiveauAcademique[]>("/niveaux/", { auth: false });
}

export function getMentorsDisponibles(niveauId: number) {
  return apiFetch<MentorDisponible[]>(`/mentors/disponibles/?niveau_id=${niveauId}`, { auth: false });
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

export function getMentorProfile() {
  return apiFetch<MentorProfile>("/mentor/profile/");
}

export function updateMentorProfile(payload: Pick<MentorProfile, "max_mentores" | "max_sessions_per_week" | "default_session_duration">) {
  return apiFetch<MentorProfile>("/mentor/profile/", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getMentorAvailability() {
  return apiFetch<MentorAvailability[]>("/mentor/availability/");
}

export function createMentorAvailability(payload: Omit<MentorAvailability, "id" | "mentor" | "weekday_label" | "date_creation" | "date_modification">) {
  return apiFetch<MentorAvailability>("/mentor/availability/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMentorAvailability(
  id: number,
  payload: Partial<Omit<MentorAvailability, "id" | "mentor" | "weekday_label" | "date_creation" | "date_modification">>,
) {
  return apiFetch<MentorAvailability>(`/mentor/availability/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteMentorAvailability(id: number) {
  return apiFetch<null>(`/mentor/availability/${id}/`, {
    method: "DELETE",
  });
}

export function getMentorAvailabilityExceptions() {
  return apiFetch<MentorAvailabilityException[]>("/mentor/availability-exceptions/");
}

export function createMentorAvailabilityException(
  payload: Pick<MentorAvailabilityException, "start_date" | "end_date" | "reason">,
) {
  return apiFetch<MentorAvailabilityException>("/mentor/availability-exceptions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteMentorAvailabilityException(id: number) {
  return apiFetch<null>(`/mentor/availability-exceptions/${id}/`, {
    method: "DELETE",
  });
}

export function getAvailableSlots(mentorId: number, startDate: string, endDate: string, auth = true) {
  return apiFetch<AvailableSlot[]>(
    `/mentors/${mentorId}/available-slots/?start_date=${startDate}&end_date=${endDate}`,
    { auth },
  );
}

export function createBooking(payload: Pick<SessionBooking, "mentor" | "starts_at" | "ends_at">) {
  return apiFetch<SessionBooking>("/bookings/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyBookings() {
  return apiFetch<SessionBooking[]>("/my-bookings/");
}

export function cancelBooking(id: number) {
  return apiFetch<SessionBooking>(`/bookings/${id}/cancel/`, {
    method: "PATCH",
  });
}
