"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, UsersRound } from "lucide-react";

import { PhoneInput } from "@/components/forms/PhoneInput";
import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";
import {
  NiveauAcademique,
  Role,
  UtilisateurPayload,
  createUtilisateur,
  formatApiError,
  getAdminCollection,
  getNiveaux,
  getRoles,
  mentorAcademicLevelOrders,
  mentoreeAcademicLevelOrders,
  updateUtilisateur,
} from "@/lib/api";
import type { HelpModuleKey } from "@/lib/helpContent";

const DEFAULT_MENTORAT_PASSWORD = "mentor123";

type MentoratProfile = "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE";

type UserRow = {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  langue_preferee?: "FR" | "EN";
  region?: string;
  profil_mentorat?: MentoratProfile;
  nombre_mentores_actuels?: number;
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
  profil_mentorat: MentoratProfile;
  statut_compte: string;
  role: string;
  niveau_academique: string;
};

type AdminUsersListProps = {
  title: string;
  description: string;
  endpoint: string;
  emptyMessage: string;
  defaultRoleName: "MENTOR" | "MENTORE";
  defaultProfile: MentoratProfile;
  profileOptions: MentoratProfile[];
  createButtonLabel: string;
  helpModuleKey?: HelpModuleKey;
};

const accountStatusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  ACTIF: "Actif",
  INACTIF: "Inactif",
  SUSPENDU: "Suspendu",
};

function normalizeAccountStatus(status?: string) {
  return status === "REFUSE" ? "INACTIF" : status;
}

const profileLabels: Record<MentoratProfile, string> = {
  MENTOR: "Mentor",
  MENTORE: "Mentoré",
  MENTOR_ET_MENTORE: "Mentor et mentoré",
};

function normalizeRows(payload: Record<string, unknown>[] | { results?: Record<string, unknown>[] }) {
  const rows = Array.isArray(payload) ? payload : payload.results ?? [];
  return rows as UserRow[];
}

function fullName(row: UserRow) {
  return `${row.prenom ?? ""} ${row.nom ?? ""}`.trim() || "Utilisateur sans nom";
}

function levelAllowedForProfile(level: NiveauAcademique, profile: MentoratProfile) {
  if (profile === "MENTOR") {
    return mentorAcademicLevelOrders.includes(level.ordre_niveau);
  }
  if (profile === "MENTOR_ET_MENTORE") {
    return mentorAcademicLevelOrders.includes(level.ordre_niveau) && mentoreeAcademicLevelOrders.includes(level.ordre_niveau);
  }
  return mentoreeAcademicLevelOrders.includes(level.ordre_niveau);
}

function profileOptionsForLevel(level: NiveauAcademique | undefined, requestedProfiles: MentoratProfile[]): MentoratProfile[] {
  if (!level) {
    return requestedProfiles;
  }
  if (level.ordre_niveau === 1) {
    return requestedProfiles.includes("MENTORE") ? ["MENTORE"] : [];
  }
  if (level.ordre_niveau === 4) {
    return requestedProfiles.includes("MENTOR") ? ["MENTOR"] : [];
  }
  return requestedProfiles.filter((profile) => levelAllowedForProfile(level, profile));
}

function levelGuidance(level: NiveauAcademique | undefined) {
  if (!level) {
    return "Choisissez d'abord un niveau académique pour afficher les profils autorisés.";
  }
  if (level.ordre_niveau === 1) {
    return "Le secondaire est réservé aux mentorés : l’option mentor est bloquée.";
  }
  if (level.ordre_niveau === 4) {
    return "Le niveau médecine est réservé aux mentors : le statut mentoré est bloqué.";
  }
  return "Ce niveau permet un profil mentor, mentoré, ou mentor et mentoré selon le besoin.";
}

export function AdminUsersList({
  title,
  description,
  endpoint,
  emptyMessage,
  defaultRoleName,
  defaultProfile,
  profileOptions,
  createButtonLabel,
  helpModuleKey,
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
  const [selectedRow, setSelectedRow] = useState<UserRow | null>(null);

  const defaultRoleId = useMemo(
    () => roles.find((role) => role.nom === defaultRoleName)?.id,
    [defaultRoleName, roles],
  );
  const mentorRoleId = useMemo(() => roles.find((role) => role.nom === "MENTOR")?.id, [roles]);
  const mentoreRoleId = useMemo(() => roles.find((role) => role.nom === "MENTORE")?.id, [roles]);
  const selectedLevel = useMemo(
    () => levels.find((level) => String(level.id) === draft.niveau_academique),
    [draft.niveau_academique, levels],
  );
  const availableProfileOptions = useMemo(
    () => profileOptionsForLevel(selectedLevel, profileOptions),
    [profileOptions, selectedLevel],
  );
  const selectableLevels = useMemo(
    () => levels.filter((level) => profileOptionsForLevel(level, profileOptions).length > 0),
    [levels, profileOptions],
  );
  const { page, setPage, pageCount, visibleItems: visibleRows } = usePagination(rows, 10);

  function roleIdForProfile(profile: MentoratProfile, fallbackRole = draft.role) {
    if (profile === "MENTOR") {
      return mentorRoleId ? String(mentorRoleId) : fallbackRole;
    }
    if (profile === "MENTORE") {
      return mentoreRoleId ? String(mentoreRoleId) : fallbackRole;
    }
    return mentorRoleId ? String(mentorRoleId) : fallbackRole || (defaultRoleId ? String(defaultRoleId) : "");
  }

  function createEmptyDraft(profile = defaultProfile): UserDraft {
    return {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      mot_de_passe: DEFAULT_MENTORAT_PASSWORD,
      langue_preferee: "FR",
      region: "",
      profil_mentorat: profile,
      statut_compte: "ACTIF",
      role: "",
      niveau_academique: "",
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
      profil_mentorat: row.profil_mentorat ?? defaultProfile,
      statut_compte: normalizeAccountStatus(row.statut_compte) ?? "ACTIF",
      role: row.role ? String(row.role) : defaultRoleId ? String(defaultRoleId) : "",
      niveau_academique: row.niveau_academique ? String(row.niveau_academique) : "",
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
      setMessage(`Statut de ${fullName(row)} mis à jour.`);
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
      setError("Rôle introuvable pour ce profil.");
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
      profil_mentorat: draft.profil_mentorat,
      statut_compte: draft.statut_compte,
      role: Number(roleIdForProfile(draft.profil_mentorat, String(roleId))),
      niveau_academique: draft.niveau_academique ? Number(draft.niveau_academique) : null,
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
        setMessage("Profil mis à jour.");
      } else {
        await createUtilisateur(payload);
        setMessage("Profil créé.");
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
        const nextProfile = value as MentoratProfile;
        nextDraft.mot_de_passe = currentDraft.mot_de_passe || DEFAULT_MENTORAT_PASSWORD;
        nextDraft.role = roleIdForProfile(nextProfile, currentDraft.role);
        const currentLevel = levels.find((level) => String(level.id) === currentDraft.niveau_academique);
        if (currentLevel && !levelAllowedForProfile(currentLevel, nextProfile)) {
          nextDraft.niveau_academique = "";
        }
      }
      if (field === "niveau_academique") {
        const nextLevel = levels.find((level) => String(level.id) === value);
        const nextProfiles = profileOptionsForLevel(nextLevel, profileOptions);
        if (nextProfiles.length > 0 && !nextProfiles.includes(currentDraft.profil_mentorat)) {
          nextDraft.profil_mentorat = nextProfiles[0];
          nextDraft.role = roleIdForProfile(nextProfiles[0], currentDraft.role);
          nextDraft.mot_de_passe = currentDraft.mot_de_passe || DEFAULT_MENTORAT_PASSWORD;
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
          Prénom
          <input
            className="field"
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
          Mot de passe {passwordDisabled ? "(actif quand le compte devient mentor)" : ""}
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
          Téléphone
          <PhoneInput
            className="field"
            value={draft.telephone}
            onChange={(event) => updateDraft("telephone", event.target.value)}
          />
        </label>
        <label>
          Région
          <input
            className="field"
            value={draft.region}
            onChange={(event) => updateDraft("region", event.target.value)}
          />
        </label>
        <label>
          Niveau académique
          <select
            className="field"
            required
            value={draft.niveau_academique}
            onChange={(event) => updateDraft("niveau_academique", event.target.value)}
          >
            <option value="">Choisir un niveau</option>
            {selectableLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Profil
          <select
            className="field"
            disabled={!selectedLevel}
            value={draft.profil_mentorat}
            onChange={(event) => updateDraft("profil_mentorat", event.target.value)}
          >
            {availableProfileOptions.map((profile) => (
              <option key={profile} value={profile}>
                {profileLabels[profile]}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{levelGuidance(selectedLevel)}</span>
        </label>
        <label>
          Langue
          <select
            className="field"
            value={draft.langue_preferee}
            onChange={(event) => updateDraft("langue_preferee", event.target.value)}
          >
            <option value="FR">Français</option>
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
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">{title}</h1>
            {helpModuleKey ? <HelpIconButton moduleKey={helpModuleKey} scope="admin" /> : null}
          </div>
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
        <ListTable
          title="Liste des profils"
          countLabel={`${rows.length} profil${rows.length > 1 ? "s" : ""}`}
          minWidth={1100}
          footer={<PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} />}
          headers={[
            { label: "Nom" },
            { label: "Email" },
            { label: "Téléphone" },
            { label: "Niveau" },
            { label: "Statut" },
            { label: "Profil" },
            { label: "Actions", className: "text-right" },
          ]}
          emptyState={rows.length === 0 ? <EmptyState icon={UsersRound} title={emptyMessage} /> : null}
        >
          {visibleRows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{fullName(row)}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.email ?? "Non renseigné"}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.telephone || "Non renseigné"}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.niveau_academique_nom ?? "Non renseigné"}</td>
              <td className="px-4 py-3">
                <select
                  className="field min-h-9 w-36 py-1 text-xs"
                  aria-label={`Statut de ${fullName(row)}`}
                  value={normalizeAccountStatus(row.statut_compte) ?? ""}
                  disabled={updatingId === row.id}
                  onChange={(event) => void handleStatusChange(row, event.target.value)}
                >
                  {Object.entries(accountStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <Badge variant="bronze">{row.profil_mentorat ? profileLabels[row.profil_mentorat] : "Non renseigné"}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedRow(row)}>
                    <Eye aria-hidden="true" />
                    Détails
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(row)}>
                    <Pencil aria-hidden="true" />
                    Modifier
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </ListTable>
      ) : null}

      <Modal
        open={Boolean(selectedRow)}
        title="Détails du profil"
        description="Informations complètes du compte sélectionné."
        className="max-w-3xl"
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
            <DetailItem label="Nom complet" value={fullName(selectedRow)} />
            <DetailItem label="Email" value={selectedRow.email ?? "Non renseigné"} />
            <DetailItem label="Téléphone" value={selectedRow.telephone || "Non renseigné"} />
            <DetailItem label="Région" value={selectedRow.region || "Non renseignée"} />
            <DetailItem label="Langue" value={selectedRow.langue_preferee || "Non renseignée"} />
            <DetailItem label="Niveau académique" value={selectedRow.niveau_academique_nom ?? "Non renseigné"} />
            <DetailItem
              label="Statut"
              value={
                selectedRow.statut_compte
                  ? accountStatusLabels[normalizeAccountStatus(selectedRow.statut_compte) ?? ""] ?? selectedRow.statut_compte
                  : "Non renseigné"
              }
            />
            <DetailItem
              label="Type de compte mentorat"
              value={selectedRow.profil_mentorat ? profileLabels[selectedRow.profil_mentorat] : "Non renseigné"}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function DetailItem({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
