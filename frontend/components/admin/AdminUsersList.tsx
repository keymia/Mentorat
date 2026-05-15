"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, UsersRound } from "lucide-react";

import { PhoneInput } from "@/components/forms/PhoneInput";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
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
  mentorAcademicLevelOrders,
  mentoreeAcademicLevelOrders,
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
  objectifs: string;
  profil_mentorat: "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE";
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
  defaultProfile: "MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE";
  profileOptions: Array<"MENTOR" | "MENTORE" | "MENTOR_ET_MENTORE">;
  createButtonLabel: string;
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

function levelAllowedForProfile(level: NiveauAcademique, profile: UserDraft["profil_mentorat"]) {
  if (profile === "MENTOR") {
    return mentorAcademicLevelOrders.includes(level.ordre_niveau);
  }
  if (profile === "MENTOR_ET_MENTORE") {
    return mentorAcademicLevelOrders.includes(level.ordre_niveau) && mentoreeAcademicLevelOrders.includes(level.ordre_niveau);
  }
  return mentoreeAcademicLevelOrders.includes(level.ordre_niveau);
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
      objectifs: row.objectifs ?? "",
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
      statut_compte: draft.statut_compte,
      role: roleId,
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
          <PhoneInput
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
        <ListTable
          title="Liste des profils"
          countLabel={`${rows.length} profil${rows.length > 1 ? "s" : ""}`}
          minWidth={1100}
          headers={[
            { label: "Nom" },
            { label: "Email" },
            { label: "Telephone" },
            { label: "Niveau" },
            { label: "Statut" },
            { label: "Profil" },
            { label: "Actions", className: "text-right" },
          ]}
          emptyState={rows.length === 0 ? <EmptyState icon={UsersRound} title={emptyMessage} /> : null}
        >
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{fullName(row)}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.email ?? "Non renseigne"}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.telephone || "Non renseigne"}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.niveau_academique_nom ?? "Non renseigne"}</td>
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
                <Badge variant="bronze">{row.profil_mentorat ? profileLabels[row.profil_mentorat] : "Non renseigne"}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedRow(row)}>
                    <Eye aria-hidden="true" />
                    Details
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
        title="Details du profil"
        description="Informations completes du compte selectionne."
        className="max-w-3xl"
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
            <DetailItem label="Nom complet" value={fullName(selectedRow)} />
            <DetailItem label="Email" value={selectedRow.email ?? "Non renseigne"} />
            <DetailItem label="Telephone" value={selectedRow.telephone || "Non renseigne"} />
            <DetailItem label="Region" value={selectedRow.region || "Non renseignee"} />
            <DetailItem label="Langue" value={selectedRow.langue_preferee || "Non renseignee"} />
            <DetailItem label="Niveau academique" value={selectedRow.niveau_academique_nom ?? "Non renseigne"} />
            <DetailItem
              label="Statut"
              value={
                selectedRow.statut_compte
                  ? accountStatusLabels[normalizeAccountStatus(selectedRow.statut_compte) ?? ""] ?? selectedRow.statut_compte
                  : "Non renseigne"
              }
            />
            <DetailItem label="Profil" value={selectedRow.profil_mentorat ? profileLabels[selectedRow.profil_mentorat] : "Non renseigne"} />
            <DetailItem label="Objectifs" value={selectedRow.objectifs || "Non renseignes"} className="md:col-span-2" />
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
