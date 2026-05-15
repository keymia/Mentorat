"use client";

import { CalendarClock, CalendarPlus, ChevronDown, ChevronUp, Eye, ImagePlus, Pencil, Save } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  MentorshipAssignment,
  MentorshipPeriod,
  UtilisateurDetail,
  continueMentorAssignment,
  formatApiError,
  getAvailableMentorshipPeriods,
  getCurrentUser,
  getMentorAssignments,
  getMentorProfile,
  updateMentorProfile,
  updateOwnProfile,
  updateOwnPassword,
} from "@/lib/api";

type SettingsSection = "account" | "profile" | "session";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function normalizeSection(value: string | null): SettingsSection {
  if (value === "profile") {
    return value;
  }
  if (value === "session") {
    return value;
  }
  return "account";
}

function formatValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "Non renseigne";
  }
  return String(value);
}

function formatFullName(user: UtilisateurDetail) {
  return `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || "Non renseigne";
}

function isPeriodExpired(period?: MentorshipPeriod) {
  if (!period?.end_date) {
    return false;
  }
  const endDate = new Date(`${period.end_date}T23:59:59`);
  return endDate < new Date();
}

export function MentorSettingsPanel() {
  const searchParams = useSearchParams();
  const section = normalizeSection(searchParams.get("section"));
  const [user, setUser] = useState<UtilisateurDetail | null>(null);
  const [mentorProfile, setMentorProfile] = useState<UtilisateurDetail | null>(null);
  const [assignments, setAssignments] = useState<MentorshipAssignment[]>([]);
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [renewalPeriodId, setRenewalPeriodId] = useState("");
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [publicProfileError, setPublicProfileError] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPublicProfileSaving, setIsPublicProfileSaving] = useState(false);
  const [isSessionSaving, setIsSessionSaving] = useState(false);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [isAccountUpdateOpen, setIsAccountUpdateOpen] = useState(false);
  const [selectedPhotoName, setSelectedPhotoName] = useState("");
  const [isTeamProfileExpanded, setIsTeamProfileExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getCurrentUser(), getMentorProfile(), getMentorAssignments(), getAvailableMentorshipPeriods()])
      .then(([currentUser, profile, assignmentRows, periodRows]) => {
        if (isMounted) {
          setUser(currentUser);
          setMentorProfile(profile);
          setAssignments(assignmentRows);
          setPeriods(periodRows);
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(formatApiError(apiError));
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const expiredAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => assignment.status === "active" && isPeriodExpired(assignment.period_detail),
      ),
    [assignments],
  );
  const renewalPeriods = useMemo(() => {
    if (expiredAssignments.length === 0) {
      return [];
    }
    const currentPeriodIds = new Set(assignments.map((assignment) => assignment.period));
    return periods.filter(
      (period) =>
        !currentPeriodIds.has(period.id) &&
        expiredAssignments.some(
          (assignment) => assignment.period_detail && period.start_date > assignment.period_detail.start_date,
        ),
    );
  }, [assignments, expiredAssignments, periods]);

  const teamProfileRows = useMemo(
    () => [
      { label: "Niveau academique", value: formatValue(mentorProfile?.niveau_academique_nom ?? user?.niveau_academique_nom) },
      { label: "Domaine ou specialite", value: formatValue(mentorProfile?.domaine_specialite) },
      { label: "Photo", value: mentorProfile?.profile_photo_url ? "Photo enregistree" : "Non renseignee" },
      { label: "Affichage Equipes", value: mentorProfile?.wants_to_appear_on_team_page ? "Accepte" : "Non accepte" },
      { label: "Validation admin", value: mentorProfile?.is_team_approved ? "Valide" : "En attente" },
      { label: "Mini bio", value: formatValue(mentorProfile?.mini_bio) },
    ],
    [mentorProfile, user],
  );

  async function reloadAssignments() {
    const assignmentRows = await getMentorAssignments();
    setAssignments(assignmentRows);
  }

  function openAccountUpdateModal() {
    setProfileError("");
    setPasswordError("");
    setPasswordMessage("");
    setIsAccountUpdateOpen(true);
  }

  async function handleContinueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSessionMessage("");
    setSessionError("");
    if (!renewalPeriodId) {
      setSessionError("Selectionnez une session.");
      return;
    }
    const period = periods.find((item) => String(item.id) === renewalPeriodId);
    if (!period) {
      setSessionError("Session introuvable.");
      return;
    }
    const assignmentsToRenew = expiredAssignments.filter(
      (assignment) => assignment.period_detail && period.start_date > assignment.period_detail.start_date,
    );
    if (assignmentsToRenew.length === 0) {
      setSessionError("Aucune session expiree ne peut etre reconduite.");
      return;
    }
    setIsSessionSaving(true);
    try {
      await Promise.all(
        assignmentsToRenew.map((assignment) => continueMentorAssignment(assignment.id, period.id)),
      );
      setRenewalPeriodId("");
      setSessionMessage("Nouvelle session enregistree.");
      await reloadAssignments();
    } catch (apiError) {
      setSessionError(formatApiError(apiError));
    } finally {
      setIsSessionSaving(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setProfileMessage("");
    setProfileError("");
    setIsProfileSaving(true);
    try {
      const updatedUser = await updateOwnProfile({
        nom: formString(formData, "nom"),
        prenom: formString(formData, "prenom"),
      });
      setUser(updatedUser);
      setProfileMessage("Informations personnelles mises a jour.");
      setIsAccountUpdateOpen(false);
    } catch (apiError) {
      setProfileError(formatApiError(apiError));
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setPasswordMessage("");
    setPasswordError("");
    setIsPasswordSaving(true);
    try {
      await updateOwnPassword(
        String(formData.get("ancien_mot_de_passe") ?? ""),
        String(formData.get("mot_de_passe") ?? ""),
      );
      setPasswordMessage("Mot de passe mis a jour.");
      form.reset();
    } catch (apiError) {
      setPasswordError(formatApiError(apiError));
    } finally {
      setIsPasswordSaving(false);
    }
  }

  async function handlePublicProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("profile_photo");
    const hasSelectedPhoto = file instanceof File && Boolean(file.name);
    const hasStoredPhoto = Boolean(mentorProfile?.profile_photo_url);
    const wantsPublic = formData.get("wants_to_appear_on_team_page") === "on";
    const domaineSpecialite = formString(formData, "domaine_specialite").trim();
    const miniBio = formString(formData, "mini_bio").trim();

    setProfileMessage("");
    setPublicProfileError("");

    if (!mentorProfile?.niveau_academique && !user?.niveau_academique) {
      setPublicProfileError("Le niveau academique du compte mentor est obligatoire.");
      return;
    }
    if (!domaineSpecialite || !miniBio || (!hasSelectedPhoto && !hasStoredPhoto) || !wantsPublic) {
      setPublicProfileError(
        "Tous les champs sont obligatoires : domaine, photo, mini bio et accord d'apparition sur la page Equipes.",
      );
      return;
    }

    if (!(file instanceof File) || !file.name) {
      formData.delete("profile_photo");
    }
    formData.set("domaine_specialite", domaineSpecialite);
    formData.set("mini_bio", miniBio);
    formData.set("wants_to_appear_on_team_page", "true");
    setIsPublicProfileSaving(true);
    try {
      const updatedProfile = await updateMentorProfile(formData);
      setMentorProfile(updatedProfile);
      setUser((currentUser) => (currentUser ? { ...currentUser, ...updatedProfile } : updatedProfile));
      setProfileMessage("Profil public mis a jour.");
      setSelectedPhotoName("");
    } catch (apiError) {
      setPublicProfileError(formatApiError(apiError));
    } finally {
      setIsPublicProfileSaving(false);
    }
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!user) {
    return <Skeleton className="h-96" />;
  }

  const visibleTeamProfileRows = isTeamProfileExpanded ? teamProfileRows : teamProfileRows.slice(0, 3);
  const accountPhotoUrl = mentorProfile?.profile_photo_url || user.profile_photo_url || "";
  const accountType = user.role_label || "Mentor";

  return (
    <div className="grid gap-6">
      <Modal
        open={isAccountDetailsOpen}
        title="Detail du compte"
        description="Informations completes visibles pour votre compte mentor."
        className="max-w-3xl"
        onClose={() => setIsAccountDetailsOpen(false)}
      >
        <div className="grid gap-4">
          {accountPhotoUrl ? (
            <Image
              src={accountPhotoUrl}
              alt=""
              width={96}
              height={96}
              unoptimized
              className="size-24 rounded-xl object-cover"
            />
          ) : null}
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
            <DetailItem label="Prenom" value={user.prenom || "Non renseigne"} />
            <DetailItem label="Nom" value={user.nom || "Non renseigne"} />
            <DetailItem label="Email" value={user.email} />
            <DetailItem label="Type de compte" value={accountType} />
            <DetailItem label="Statut du compte" value={formatValue(user.statut_compte)} />
            <DetailItem
              label="Date de creation"
              value={user.date_creation ? new Date(user.date_creation).toLocaleDateString("fr-CA") : "Non renseignee"}
            />
            {mentorProfile?.domaine_specialite ? (
              <DetailItem label="Titre public" value={mentorProfile.domaine_specialite} />
            ) : null}
            {mentorProfile?.mini_bio ? (
              <DetailItem label="Description publique" value={mentorProfile.mini_bio} className="md:col-span-2" />
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={isAccountUpdateOpen}
        title="Mettre a jour le compte"
        description="Seules les informations personnelles autorisees sont modifiables."
        className="max-w-4xl"
        onClose={() => setIsAccountUpdateOpen(false)}
      >
        <div className="grid gap-5">
          <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
            {profileError ? <Alert variant="error" className="md:col-span-2">{profileError}</Alert> : null}
            <label>
              Prenom
              <Input name="prenom" defaultValue={user.prenom} required />
            </label>
            <label>
              Nom
              <Input name="nom" defaultValue={user.nom} required />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" className="w-fit" disabled={isProfileSaving}>
                <Save aria-hidden="true" />
                {isProfileSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>

          <form onSubmit={handlePasswordSubmit} className="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
            {passwordMessage ? <Alert variant="success" className="md:col-span-2">{passwordMessage}</Alert> : null}
            {passwordError ? <Alert variant="error" className="md:col-span-2">{passwordError}</Alert> : null}
            <label>
              Ancien mot de passe
              <Input name="ancien_mot_de_passe" type="password" required />
            </label>
            <label>
              Nouveau mot de passe
              <Input name="mot_de_passe" type="password" minLength={8} required />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" variant="outline" disabled={isPasswordSaving}>
                {isPasswordSaving ? "Mise a jour..." : "Mettre a jour le mot de passe"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {section === "account" ? (
        <div className="grid gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Mon compte</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Consultez et mettez a jour uniquement les informations personnelles autorisees.
            </p>
          </div>
          {profileMessage ? <Alert variant="success">{profileMessage}</Alert> : null}
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
              <td className="px-4 py-3 font-medium text-foreground">{formatFullName(user)}</td>
              <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{accountType}</td>
              <td className="px-4 py-3">
                <Badge variant={user.statut_compte === "ACTIF" ? "success" : "outline"}>
                  {formatValue(user.statut_compte)}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAccountDetailsOpen(true)}>
                    <Eye aria-hidden="true" />
                    Detail
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={openAccountUpdateModal}>
                    <Pencil aria-hidden="true" />
                    Mettre a jour
                  </Button>
                </div>
              </td>
            </tr>
          </ListTable>
        </div>
      ) : null}

      {section === "profile" ? (
        <Card>
          <CardHeader>
            <CardTitle>Profil Equipes</CardTitle>
            <CardDescription>
              Completez les informations qui seront visibles sur la page Equipes apres validation de l&apos;administration.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {profileMessage ? <Alert variant="success">{profileMessage}</Alert> : null}
            {publicProfileError ? <Alert variant="error">{publicProfileError}</Alert> : null}
            <ul className="overflow-hidden rounded-lg border border-border">
              {visibleTeamProfileRows.map((row, index) => (
                <li
                  key={row.label}
                  className={`grid gap-1 p-4 text-sm sm:grid-cols-[220px_1fr] ${
                    index < visibleTeamProfileRows.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="font-medium text-muted-foreground">{row.label}</span>
                  <span className="break-words font-semibold text-foreground">{row.value}</span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="ghost"
              className="w-fit"
              onClick={() => setIsTeamProfileExpanded((current) => !current)}
            >
              {isTeamProfileExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
              {isTeamProfileExpanded ? "Reduire" : "Voir plus et modifier"}
            </Button>
            {isTeamProfileExpanded ? (
              <form onSubmit={handlePublicProfileSubmit} className="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
                <div className="grid gap-2 text-sm">
                  <span className="font-medium text-foreground">Niveau academique</span>
                  <Input value={mentorProfile?.niveau_academique_nom ?? user.niveau_academique_nom ?? "Non renseigne"} readOnly />
                  <span className="text-xs text-muted-foreground">Ce niveau vient de votre compte mentor.</span>
                </div>
                <label>
                  Domaine ou specialite
                  <Input name="domaine_specialite" defaultValue={mentorProfile?.domaine_specialite ?? ""} required />
                </label>
                <div className="grid gap-3 md:col-span-2">
                  <span className="text-sm font-medium text-foreground">Photo a afficher sur le site</span>
                  <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="grid gap-1 text-sm">
                      <span className="font-semibold text-foreground">
                        {selectedPhotoName || (mentorProfile?.profile_photo_url ? "Photo deja enregistree" : "Aucune photo choisie")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Formats images acceptes. Cette photo apparaitra apres validation de l&apos;administration.
                      </span>
                    </div>
                    <input
                      id="team-profile-photo"
                      name="profile_photo"
                      type="file"
                      accept="image/*"
                      aria-required={!mentorProfile?.profile_photo_url}
                      className="sr-only"
                      onChange={(event) => setSelectedPhotoName(event.target.files?.[0]?.name ?? "")}
                    />
                    <label
                      htmlFor="team-profile-photo"
                      className="inline-flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-card-foreground outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ImagePlus aria-hidden="true" className="size-4" />
                      {mentorProfile?.profile_photo_url ? "Changer la photo" : "Choisir une photo"}
                    </label>
                  </div>
                </div>
                <label className="md:col-span-2">
                  Mini bio
                  <Textarea
                    name="mini_bio"
                    rows={5}
                    defaultValue={mentorProfile?.mini_bio ?? ""}
                    placeholder="Presentez brievement votre parcours, votre niveau d'etude, votre domaine, votre engagement et votre motivation."
                    required
                  />
                </label>
                <label className="flex items-start gap-3 text-sm text-muted-foreground md:col-span-2">
                  <input
                    name="wants_to_appear_on_team_page"
                    type="checkbox"
                    defaultChecked={Boolean(mentorProfile?.wants_to_appear_on_team_page)}
                    required
                    className="mt-1"
                  />
                  <span>J&apos;accepte d&apos;apparaitre sur la page Equipes.</span>
                </label>
                <Button type="submit" className="w-fit" disabled={isPublicProfileSaving}>
                  <Save aria-hidden="true" />
                  {isPublicProfileSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {section === "session" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5 text-primary" aria-hidden="true" />
              Session de mentorat
            </CardTitle>
            <CardDescription>
              Consultez la session actuelle et choisissez une nouvelle session uniquement lorsque la session en cours est expiree.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {assignments.length === 0 ? (
              <Alert>Aucune session de mentorat n&apos;est associee a votre compte pour le moment.</Alert>
            ) : (
              <>
                <form onSubmit={handleContinueSubmit} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <label>
                    Session a choisir
                    <select
                      className="field"
                      value={renewalPeriodId}
                      onChange={(event) => {
                        setRenewalPeriodId(event.target.value);
                        setSessionError("");
                        setSessionMessage("");
                      }}
                      disabled={expiredAssignments.length === 0 || renewalPeriods.length === 0}
                      required
                    >
                      <option value="">Choisir une session</option>
                      {renewalPeriods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {period.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button type="submit" className="w-fit" disabled={isSessionSaving || !renewalPeriodId}>
                    <CalendarPlus aria-hidden="true" />
                    {isSessionSaving ? "Enregistrement..." : "Continuer"}
                  </Button>
                </form>

                {expiredAssignments.length === 0 ? (
                  <Alert>La session en cours n&apos;est pas encore expiree.</Alert>
                ) : null}
                {expiredAssignments.length > 0 && renewalPeriods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune nouvelle session disponible.</p>
                ) : null}

                {sessionMessage ? <Alert variant="success">{sessionMessage}</Alert> : null}
                {sessionError ? <Alert variant="error">{sessionError}</Alert> : null}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
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
