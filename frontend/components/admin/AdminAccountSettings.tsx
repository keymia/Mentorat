"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Eye, Pencil, Save } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AccountProfile,
  formatApiError,
  getAccountMe,
  updateAccountMe,
  updateOwnPassword,
} from "@/lib/api";

type Draft = {
  prenom: string;
  nom: string;
  can_appear_on_about_page: boolean;
  public_title: string;
  public_description: string;
};

function buildDraft(profile: AccountProfile): Draft {
  return {
    prenom: profile.prenom ?? "",
    nom: profile.nom ?? "",
    can_appear_on_about_page: Boolean(profile.can_appear_on_about_page),
    public_title: profile.public_title ?? "",
    public_description: profile.public_description ?? "",
  };
}

function fullName(profile: AccountProfile) {
  return `${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || "Non renseigné";
}

function accountType(profile: AccountProfile) {
  if (profile.role_label) {
    return profile.role_label;
  }
  if (profile.role_nom === "ADMIN_PRINCIPAL") {
    return "Administrateur principal";
  }
  if (profile.role_nom === "ADMIN_OPERATIONNEL") {
    return "Administrateur opérationnel";
  }
  return "Administration";
}

function publicStatusLabel(profile: AccountProfile | null) {
  if (!profile) {
    return "Non soumis";
  }
  if (profile.pending_public_validation) {
    return "En attente";
  }
  if (profile.is_public_profile_approved) {
    return "Validé";
  }
  if (profile.public_profile_status === "REFUSE") {
    return "Refusé";
  }
  return "Non soumis";
}

export function AdminAccountSettings() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [draft, setDraft] = useState<Draft>({
    prenom: "",
    nom: "",
    can_appear_on_about_page: false,
    public_title: "",
    public_description: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  const isOperationalAdmin = profile?.role_nom === "ADMIN_OPERATIONNEL";
  const canEditPublicProfile = profile?.role_nom === "ADMIN_PRINCIPAL" || isOperationalAdmin;
  const photoUrl = profile?.public_photo_url || profile?.profile_photo_url || "";

  useEffect(() => {
    let isMounted = true;
    getAccountMe()
      .then((payload) => {
        if (isMounted) {
          setProfile(payload);
          setDraft(buildDraft(payload));
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
  }, []);

  function openUpdateModal() {
    if (profile) {
      setDraft(buildDraft(profile));
    }
    setError("");
    setPasswordError("");
    setMessage("");
    setPasswordMessage("");
    setIsUpdateOpen(true);
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      return;
    }

    const form = event.currentTarget;
    setIsSaving(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("prenom", draft.prenom);
    formData.append("nom", draft.nom);

    if (canEditPublicProfile) {
      formData.append("can_appear_on_about_page", String(draft.can_appear_on_about_page));
      formData.append("public_title", draft.public_title);
      formData.append("public_description", draft.public_description);
      const photo = new FormData(form).get("public_photo");
      if (photo instanceof File && photo.size > 0) {
        formData.append("public_photo", photo);
      }
    }

    try {
      const updated = await updateAccountMe(formData);
      setProfile(updated);
      setDraft(buildDraft(updated));
      setMessage(
        isOperationalAdmin
          ? "Informations enregistrées. Les informations publiques modifiées sont en attente de validation."
          : "Informations personnelles et profil public mis à jour.",
      );
      setIsUpdateOpen(false);
      form.reset();
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsPasswordSaving(true);
    setPasswordError("");
    setPasswordMessage("");

    const formData = new FormData(form);
    try {
      await updateOwnPassword(
        String(formData.get("ancien_mot_de_passe") ?? ""),
        String(formData.get("mot_de_passe") ?? ""),
      );
      setPasswordMessage("Mot de passe mis à jour.");
      form.reset();
    } catch (apiError) {
      setPasswordError(formatApiError(apiError));
    } finally {
      setIsPasswordSaving(false);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!profile) {
    return <Alert variant="error">{error || "Compte introuvable."}</Alert>;
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Mon compte</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Consultez et mettez à jour uniquement les informations personnelles autorisées.
        </p>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <ListTable
        title="Informations du compte"
        countLabel="1 compte"
        minWidth={900}
        headers={[
          { label: "Nom complet" },
          { label: "Email" },
          { label: "Type de compte" },
          { label: "Statut" },
          { label: "Actions", className: "text-right" },
        ]}
      >
        <tr className="align-top">
          <td className="px-4 py-3 font-medium text-foreground">{fullName(profile)}</td>
          <td className="px-4 py-3 text-muted-foreground">{profile.email}</td>
          <td className="px-4 py-3 text-muted-foreground">{accountType(profile)}</td>
          <td className="px-4 py-3">
            <Badge variant={profile.statut_compte === "ACTIF" ? "success" : "outline"}>{profile.statut_compte}</Badge>
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsDetailsOpen(true)}>
                <Eye aria-hidden="true" />
                Détail
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={openUpdateModal}>
                <Pencil aria-hidden="true" />
                Mettre à jour
              </Button>
            </div>
          </td>
        </tr>
      </ListTable>

      <Modal
        open={isDetailsOpen}
        title="Détail du compte"
        description="Informations complètes visibles pour votre compte."
        className="max-w-3xl"
        onClose={() => setIsDetailsOpen(false)}
      >
        <div className="grid gap-4">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt=""
              width={96}
              height={96}
              unoptimized
              className="size-24 rounded-xl object-cover"
            />
          ) : null}
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
            <DetailItem label="Prénom" value={profile.prenom || "Non renseigné"} />
            <DetailItem label="Nom" value={profile.nom || "Non renseigné"} />
            <DetailItem label="Email" value={profile.email} />
            <DetailItem label="Type de compte" value={accountType(profile)} />
            <DetailItem label="Statut du compte" value={profile.statut_compte || "Non renseigné"} />
            <DetailItem
              label="Date de création"
              value={profile.date_creation ? new Date(profile.date_creation).toLocaleDateString("fr-CA") : "Non renseignée"}
            />
            {canEditPublicProfile ? (
              <DetailItem label="Affichage À propos" value={profile.can_appear_on_about_page ? "Visible" : "Masqué"} />
            ) : null}
            {profile.public_title ? <DetailItem label="Titre public" value={profile.public_title} /> : null}
            {profile.public_description ? (
              <DetailItem label="Description publique" value={profile.public_description} className="md:col-span-2" />
            ) : null}
            {isOperationalAdmin ? (
              <DetailItem label="Validation publique" value={publicStatusLabel(profile)} />
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={isUpdateOpen}
        title="Mettre à jour le compte"
        description="Seules les informations personnelles autorisées sont modifiables."
        className="max-w-4xl"
        onClose={() => setIsUpdateOpen(false)}
      >
        <div className="grid gap-5">
          <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
              <label>
                Prénom
                <input
                  className="field"
                  value={draft.prenom}
                  onChange={(event) => setDraft({ ...draft, prenom: event.target.value })}
                />
              </label>
            <label>
              Nom
              <input
                className="field"
                required
                value={draft.nom}
                onChange={(event) => setDraft({ ...draft, nom: event.target.value })}
              />
            </label>
            {canEditPublicProfile ? (
              <>
                <label>
                  Afficher sur la page À propos
                  <select
                    className="field"
                    value={draft.can_appear_on_about_page ? "true" : "false"}
                    onChange={(event) =>
                      setDraft({ ...draft, can_appear_on_about_page: event.target.value === "true" })
                    }
                  >
                    <option value="false">Non</option>
                    <option value="true">Oui</option>
                  </select>
                </label>
                <label>
                  Photo publique
                  <input name="public_photo" className="field" type="file" accept="image/*" />
                </label>
                <label>
                  Titre public
                  <input
                    className="field"
                    required={draft.can_appear_on_about_page}
                    value={draft.public_title}
                    onChange={(event) => setDraft({ ...draft, public_title: event.target.value })}
                  />
                </label>
                <label className="md:col-span-2">
                  Description publique
                  <textarea
                    className="field"
                    rows={4}
                    value={draft.public_description}
                    onChange={(event) => setDraft({ ...draft, public_description: event.target.value })}
                  />
                </label>
              </>
            ) : null}
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSaving}>
                <Save aria-hidden="true" />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>

          <form onSubmit={handlePasswordSubmit} className="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
            {passwordMessage ? <Alert variant="success" className="md:col-span-2">{passwordMessage}</Alert> : null}
            {passwordError ? <Alert variant="error" className="md:col-span-2">{passwordError}</Alert> : null}
            <label>
              Ancien mot de passe
              <input name="ancien_mot_de_passe" className="field" type="password" required />
            </label>
            <label>
              Nouveau mot de passe
              <input name="mot_de_passe" className="field" type="password" minLength={8} required />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" variant="outline" disabled={isPasswordSaving}>
                {isPasswordSaving ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

function DetailItem({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
