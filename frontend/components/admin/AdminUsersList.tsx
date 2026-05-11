"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, UsersRound } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NiveauAcademique,
  Role,
  UtilisateurPayload,
  createUtilisateur,
  formatApiError,
  getAdminCollection,
  getNiveaux,
  getRoles,
  updateUtilisateur,
} from "@/lib/api";

const DEFAULT_MENTORAT_PASSWORD = "mentor123";

type UserRow = {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  langue_preferee?: "FR" | "EN";
  region?: string;
  objectifs?: string;
  profil_mentorat?: "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE";
  capacite_mentorat?: number;
  nombre_mentores_actuels?: number;
  capacite_restante?: number;
  statut_compte?: string;
  role?: number;
  role_nom?: string;
  niveau_academique?: number;
  niveau_academique_nom?: string;
};

type UserDraft = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  mot_de_passe: string;
  langue_preferee: "FR" | "EN";
  region: string;
  objectifs: string;
  profil_mentorat: "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE";
  capacite_mentorat: string;
  statut_compte: string;
  role: string;
  niveau_academique: string;
  is_active: boolean;
};

type AdminUsersListProps = {
  title: string;
  description: string;
  endpoint: string;
  emptyMessage: string;
  showCapacity?: boolean;
  defaultRoleName: "MENTOR" | "MENTORE";
  defaultProfile: "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE";
  profileOptions: Array<"MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE">;
  createButtonLabel: string;
};

const accountStatusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  ACTIF: "Actif",
  INACTIF: "Inactif",
  REFUSE: "Refuse",
  SUSPENDU: "Suspendu",
};

const profileLabels: Record<UserDraft["profil_mentorat"], string> = {
  MENTOR: "Mentor",
  MENTORE: "Mentore",
  MENTOR_ET_MENTORE: "Mentor et mentore",
};

function normalizeRows(payload: Record<string, unknown>[] | { results?: Record<string, unknown>[] }) {
  const rows = Array.isArray(payload) ? payload : payload.results ?? [];
  return rows as UserRow[];
}

function fullName(row: UserRow) {
  return `${row.prenom ?? ""} ${row.nom ?? ""}`.trim() || "Utilisateur sans nom";
}

function capacityLabel(row: UserRow) {
  const current = row.nombre_mentores_actuels ?? 0;
  const total = row.capacite_mentorat ?? 0;
  const remaining = row.capacite_restante ?? Math.max(total - current, 0);
  return `${current}/${total} occupes, ${remaining} disponible${remaining > 1 ? "s" : ""}`;
}

function levelAllowedForProfile(level: NiveauAcademique, profile: UserDraft["profil_mentorat"]) {
  if (profile === "MENTOR") {
    return !level.est_premier_niveau;
  }
  if (profile === "MENTOR_ET_MENTORE") {
    return !level.est_premier_niveau && !level.est_dernier_niveau;
  }
  return !level.est_dernier_niveau;
}

export function AdminUsersList({
  title,
  description,
  endpoint,
  emptyMessage,
  showCapacity = false,
  defaultRoleName,
  defaultProfile,
  profileOptions,
  createButtonLabel,
}: AdminUsersListProps) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [levels, setLevels] = useState<NiveauAcademique[]>([]);
  const [draft, setDraft] = useState<UserDraft>(() => createEmptyDraft(defaultProfile));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const defaultRoleId = useMemo(
    () => roles.find((role) => role.nom === defaultRoleName)?.id,
    [defaultRoleName, roles],
  );
  const allowedLevels = useMemo(
    () => levels.filter((level) => levelAllowedForProfile(level, draft.profil_mentorat)),
    [draft.profil_mentorat, levels],
  );

  function createEmptyDraft(profile = defaultProfile): UserDraft {
    return {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      mot_de_passe: DEFAULT_MENTORAT_PASSWORD,
      langue_preferee: "FR",
      region: "",
      objectifs: "",
      profil_mentorat: profile,
      capacite_mentorat: profile === "MENTORE" ? "0" : "1",
      statut_compte: "ACTIF",
      role: "",
      niveau_academique: "",
      is_active: true,
    };
  }

  async function loadData() {
    const [payload, roleData, levelData] = await Promise.all([
      getAdminCollection(endpoint),
      getRoles(),
      getNiveaux(),
    ]);
    setRows(normalizeRows(payload));
    setRoles(roleData);
    setLevels(levelData);
    setError("");
  }

  useEffect(() => {
    let isMounted = true;
    Promise.all([getAdminCollection(endpoint), getRoles(), getNiveaux()])
      .then(([payload, roleData, levelData]) => {
        if (isMounted) {
          setRows(normalizeRows(payload));
          setRoles(roleData);
          setLevels(levelData);
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
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  function openCreateModal() {
    const nextDraft = createEmptyDraft(defaultProfile);
    nextDraft.role = defaultRoleId ? String(defaultRoleId) : "";
    setDraft(nextDraft);
    setEditingId(null);
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function openEditModal(row: UserRow) {
    setDraft({
      nom: row.nom ?? "",
      prenom: row.prenom ?? "",
      email: row.email ?? "",
      telephone: row.telephone ?? "",
      mot_de_passe: DEFAULT_MENTORAT_PASSWORD,
      langue_preferee: row.langue_preferee ?? "FR",
      region: row.region ?? "",
      objectifs: row.objectifs ?? "",
      profil_mentorat: row.profil_mentorat ?? defaultProfile,
      capacite_mentorat: String(row.capacite_mentorat ?? 0),
      statut_compte: row.statut_compte ?? "ACTIF",
      role: row.role ? String(row.role) : defaultRoleId ? String(defaultRoleId) : "",
      niveau_academique: row.niveau_academique ? String(row.niveau_academique) : "",
      is_active: true,
    });
    setEditingId(row.id);
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setDraft(createEmptyDraft(defaultProfile));
    setEditingId(null);
    setIsFormOpen(false);
  }

  async function handleStatusChange(row: UserRow, status: string) {
    setUpdatingId(row.id);
    setError("");
    setMessage("");
    try {
      const updated = await updateUtilisateur(row.id, { statut_compte: status });
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.id === row.id
            ? {
                ...currentRow,
                statut_compte: updated.statut_compte,
              }
            : currentRow,
        ),
      );
      setMessage(`Statut de ${fullName(row)} mis a jour.`);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    const roleId = draft.role ? Number(draft.role) : defaultRoleId;
    if (!roleId) {
      setError("Role introuvable pour ce profil.");
      setIsSaving(false);
      return;
    }

    const payload: UtilisateurPayload = {
      nom: draft.nom,
      prenom: draft.prenom,
      email: draft.email,
      telephone: draft.telephone,
      langue_preferee: draft.langue_preferee,
      region: draft.region,
      objectifs: draft.objectifs,
      profil_mentorat: draft.profil_mentorat,
      capacite_mentorat: Number(draft.capacite_mentorat || 0),
      statut_compte: draft.statut_compte,
      role: roleId,
      niveau_academique: draft.niveau_academique ? Number(draft.niveau_academique) : null,
      is_active: draft.is_active,
    };
    if (draft.mot_de_passe && draft.profil_mentorat !== "MENTORE") {
      payload.mot_de_passe = draft.mot_de_passe;
    }
    if (!editingId && draft.profil_mentorat === "MENTORE") {
      payload.mot_de_passe = DEFAULT_MENTORAT_PASSWORD;
    }

    try {
      if (editingId) {
        await updateUtilisateur(editingId, payload);
        setMessage("Profil mis a jour.");
      } else {
        await createUtilisateur(payload);
        setMessage("Profil cree.");
      }
      closeFormModal();
      await loadData();
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  function updateDraft(field: keyof UserDraft, value: string | boolean) {
    setDraft((currentDraft) => {
      const nextDraft = { ...currentDraft, [field]: value };
      if (field === "profil_mentorat") {
        nextDraft.capacite_mentorat = value === "MENTORE" ? "0" : currentDraft.capacite_mentorat || "1";
        nextDraft.mot_de_passe = currentDraft.mot_de_passe || DEFAULT_MENTORAT_PASSWORD;
        const selectedLevel = levels.find((level) => String(level.id) === currentDraft.niveau_academique);
        if (selectedLevel && !levelAllowedForProfile(selectedLevel, value as UserDraft["profil_mentorat"])) {
          nextDraft.niveau_academique = "";
        }
      }
      return nextDraft;
    });
  }

  function renderUserForm() {
    const passwordDisabled = draft.profil_mentorat === "MENTORE";

    return (
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label>
          Prenom
          <input
            className="field"
            required
            value={draft.prenom}
            onChange={(event) => updateDraft("prenom", event.target.value)}
          />
        </label>
        <label>
          Nom
          <input
            className="field"
            required
            value={draft.nom}
            onChange={(event) => updateDraft("nom", event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            className="field"
            type="email"
            required
            value={draft.email}
            onChange={(event) => updateDraft("email", event.target.value)}
          />
        </label>
        <label>
          Mot de passe {passwordDisabled ? "(active quand le compte devient mentor)" : ""}
          <input
            className="field"
            type="password"
            minLength={8}
            required={!editingId && !passwordDisabled}
            disabled={passwordDisabled}
            value={draft.mot_de_passe}
            onChange={(event) => updateDraft("mot_de_passe", event.target.value)}
          />
        </label>
        <label>
          Telephone
          <input
            className="field"
            value={draft.telephone}
            onChange={(event) => updateDraft("telephone", event.target.value)}
          />
        </label>
        <label>
          Region
          <input
            className="field"
            value={draft.region}
            onChange={(event) => updateDraft("region", event.target.value)}
          />
        </label>
        <label>
          Profil
          <select
            className="field"
            value={draft.profil_mentorat}
            onChange={(event) => updateDraft("profil_mentorat", event.target.value)}
          >
            {profileOptions.map((profile) => (
              <option key={profile} value={profile}>
                {profileLabels[profile]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Niveau academique
          <select
            className="field"
            required
            value={draft.niveau_academique}
            onChange={(event) => updateDraft("niveau_academique", event.target.value)}
          >
            <option value="">Choisir un niveau</option>
            {allowedLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Langue
          <select
            className="field"
            value={draft.langue_preferee}
            onChange={(event) => updateDraft("langue_preferee", event.target.value)}
          >
            <option value="FR">Francais</option>
            <option value="EN">Anglais</option>
          </select>
        </label>
        <label>
          Statut
          <select
            className="field"
            value={draft.statut_compte}
            onChange={(event) => updateDraft("statut_compte", event.target.value)}
          >
            {Object.entries(accountStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Capacite mentorat
          <input
            className="field"
            type="number"
            min={0}
            disabled={draft.profil_mentorat === "MENTORE"}
            value={draft.capacite_mentorat}
            onChange={(event) => updateDraft("capacite_mentorat", event.target.value)}
          />
        </label>
        <label className="flex items-center gap-3 pt-7 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(event) => updateDraft("is_active", event.target.checked)}
          />
          <span>Compte techniquement actif</span>
        </label>
        <label className="md:col-span-2">
          Objectifs
          <textarea
            className="field"
            rows={3}
            value={draft.objectifs}
            onChange={(event) => updateDraft("objectifs", event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" disabled={isSaving}>
            <Plus aria-hidden="true" />
            {isSaving ? "Enregistrement..." : editingId ? "Enregistrer" : createButtonLabel}
          </Button>
          <Button type="button" variant="outline" onClick={closeFormModal}>
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button type="button" className="w-fit" onClick={openCreateModal}>
          <Plus aria-hidden="true" />
          {createButtonLabel}
        </Button>
      </div>

      {isLoading ? <Skeleton className="h-56" /> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Modal
        open={isFormOpen}
        title={editingId ? "Modifier le profil" : createButtonLabel}
        description="Renseignez les informations du compte et son statut."
        className="max-w-4xl"
        onClose={closeFormModal}
      >
        {renderUserForm()}
      </Modal>

      {!isLoading && !error ? (
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-muted px-4 py-3 text-sm font-medium">
            {rows.length} profil{rows.length > 1 ? "s" : ""}
          </div>

          {rows.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={UsersRound} title={emptyMessage} />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <CardContent key={row.id} className="grid gap-3 p-4 xl:grid-cols-[1.2fr_1fr_1fr_220px_120px]">
                  <div>
                    <h2 className="font-semibold text-foreground">{fullName(row)}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{row.email ?? "Email non renseigne"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{row.telephone ?? "Telephone non renseigne"}</p>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Niveau:</span>{" "}
                      {row.niveau_academique_nom ?? "Non renseigne"}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Region:</span> {row.region || "Non renseignee"}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Langue:</span> {row.langue_preferee || "Non renseignee"}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={row.statut_compte === "ACTIF" ? "success" : "outline"}>
                        {row.statut_compte ? accountStatusLabels[row.statut_compte] ?? row.statut_compte : "Non renseigne"}
                      </Badge>
                      <Badge variant="bronze">{row.profil_mentorat ? profileLabels[row.profil_mentorat] : "Non renseigne"}</Badge>
                    </div>
                    {showCapacity ? (
                      <p className="mt-1">
                        <span className="font-medium text-foreground">Capacite:</span> {capacityLabel(row)}
                      </p>
                    ) : null}
                  </div>

                  <label className="text-sm">
                    Statut du compte
                    <select
                      className="field"
                      value={row.statut_compte ?? ""}
                      disabled={updatingId === row.id}
                      onChange={(event) => void handleStatusChange(row, event.target.value)}
                    >
                      {Object.entries(accountStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-start xl:justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(row)}>
                      <Pencil aria-hidden="true" />
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
