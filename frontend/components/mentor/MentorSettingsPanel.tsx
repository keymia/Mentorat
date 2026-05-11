"use client";

import { KeyRound, Save, UserRoundCog } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { UtilisateurDetail, formatApiError, getCurrentUser, updateOwnPassword, updateOwnProfile } from "@/lib/api";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export function MentorSettingsPanel() {
  const [user, setUser] = useState<UtilisateurDetail | null>(null);
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((data) => {
        if (isMounted) {
          setUser(data);
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
        email: formString(formData, "email"),
        telephone: formString(formData, "telephone"),
        langue_preferee: formString(formData, "langue_preferee") as "FR" | "EN",
        region: formString(formData, "region"),
        objectifs: formString(formData, "objectifs"),
      });
      setUser(updatedUser);
      setProfileMessage("Informations mises a jour.");
    } catch (apiError) {
      setProfileError(formatApiError(apiError));
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const password = formString(formData, "mot_de_passe");
    const confirmation = formString(formData, "confirmation");
    setPasswordMessage("");
    setPasswordError("");

    if (password !== confirmation) {
      setPasswordError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsPasswordSaving(true);
    try {
      const response = await updateOwnPassword(password);
      formElement.reset();
      setPasswordMessage(response.detail);
    } catch (apiError) {
      setPasswordError(formatApiError(apiError));
    } finally {
      setIsPasswordSaving(false);
    }
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!user) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundCog className="size-5 text-primary" aria-hidden="true" />
            Informations personnelles
          </CardTitle>
          <CardDescription>Coordonnees et preferences visibles dans votre espace mentor.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
            <label>
              Nom
              <Input name="nom" defaultValue={user.nom} required />
            </label>
            <label>
              Prenom
              <Input name="prenom" defaultValue={user.prenom} required />
            </label>
            <label>
              Email de connexion
              <Input name="email" type="email" defaultValue={user.email} required />
            </label>
            <label>
              Telephone
              <Input name="telephone" defaultValue={user.telephone} />
            </label>
            <label>
              Langue preferee
              <select name="langue_preferee" className="field" defaultValue={user.langue_preferee ?? "FR"}>
                <option value="FR">Francais</option>
                <option value="EN">Anglais</option>
              </select>
            </label>
            <label>
              Region
              <Input name="region" defaultValue={user.region} />
            </label>
            <label className="md:col-span-2">
              Objectifs
              <Textarea name="objectifs" defaultValue={user.objectifs} />
            </label>
            <Button type="submit" className="w-fit" disabled={isProfileSaving}>
              <Save aria-hidden="true" />
              {isProfileSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
          {profileMessage ? (
            <Alert variant="success" className="mt-4">
              {profileMessage}
            </Alert>
          ) : null}
          {profileError ? (
            <Alert variant="error" className="mt-4">
              {profileError}
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 content-start">
        <Card>
          <CardHeader>
            <CardTitle>Compte</CardTitle>
            <CardDescription>Informations gerees par l&apos;administration.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/25 p-3">
              <span className="block text-muted-foreground">Profil</span>
              <span className="font-semibold">{user.profil_mentorat ?? "Non defini"}</span>
            </div>
            <div className="rounded-lg border border-border bg-muted/25 p-3">
              <span className="block text-muted-foreground">Niveau academique</span>
              <span className="font-semibold">{user.niveau_academique_nom ?? "Non renseigne"}</span>
            </div>
            <div className="rounded-lg border border-border bg-muted/25 p-3">
              <span className="block text-muted-foreground">Capacite</span>
              <span className="font-semibold">
                {user.nombre_mentores_actuels}/{user.capacite_mentorat} mentores
              </span>
            </div>
            <div className="rounded-lg border border-border bg-muted/25 p-3">
              <span className="block text-muted-foreground">Statut</span>
              <span className="font-semibold">{user.statut_compte ?? "Non defini"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" aria-hidden="true" />
              Mot de passe
            </CardTitle>
            <CardDescription>Modifiable a tout moment depuis votre espace mentor.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="grid gap-4">
              <label>
                Nouveau mot de passe
                <Input name="mot_de_passe" type="password" minLength={8} required />
              </label>
              <label>
                Confirmation
                <Input name="confirmation" type="password" minLength={8} required />
              </label>
              <Button type="submit" className="w-fit" disabled={isPasswordSaving}>
                <KeyRound aria-hidden="true" />
                {isPasswordSaving ? "Enregistrement..." : "Modifier"}
              </Button>
            </form>
            {passwordMessage ? (
              <Alert variant="success" className="mt-4">
                {passwordMessage}
              </Alert>
            ) : null}
            {passwordError ? (
              <Alert variant="error" className="mt-4">
                {passwordError}
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
