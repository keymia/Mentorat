"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  formatApiError,
  login,
  verifyLoginCode,
  type AuthSuccessResponse,
  type LoginChallengeResponse,
} from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<LoginChallengeResponse | null>(null);

  function getUserHomePath(user: Record<string, unknown>) {
    const roleName = String(user.role_nom ?? "");
    const mentorProfile = String(user.profil_mentorat ?? "");
    if (roleName === "ADMIN_PRINCIPAL" || roleName === "ADMIN_OPERATIONNEL") {
      return "/admin/dashboard";
    }
    if (mentorProfile === "MENTOR" || mentorProfile === "MENTOR_ET_MENTORE") {
      return "/mentor/dashboard";
    }
    return "/";
  }

  function getRedirectPath(user: Record<string, unknown>) {
    const nextPath = searchParams.get("next");
    const homePath = getUserHomePath(user);

    if (homePath.startsWith("/admin")) {
      return nextPath?.startsWith("/admin") ? nextPath : "/admin/dashboard";
    }
    if (homePath.startsWith("/mentor")) {
      return nextPath?.startsWith("/mentor") ? nextPath : "/mentor/dashboard";
    }
    return homePath;
  }

  function completeLogin(response: AuthSuccessResponse) {
    window.localStorage.setItem("mentorat_access", response.access);
    window.localStorage.setItem("mentorat_refresh", response.refresh);
    document.cookie = `mentorat_access=${response.access}; path=/; max-age=3600; SameSite=Lax`;
    document.cookie = `mentorat_home=${getUserHomePath(response.user)}; path=/; max-age=3600; SameSite=Lax`;
    router.push(getRedirectPath(response.user));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      if (challenge) {
        const response = await verifyLoginCode(challenge.challenge_id, String(formData.get("code") ?? ""));
        completeLogin(response);
        return;
      }

      const response = await login(String(formData.get("email") ?? ""), String(formData.get("mot_de_passe") ?? ""));
      if ("access" in response) {
        completeLogin(response);
        return;
      }
      if (response.requires_2fa) {
        setChallenge(response);
        return;
      }
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {challenge ? (
        <>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Un code temporaire a ete envoye a {challenge.email}. Il expire dans{" "}
            {challenge.expires_in_minutes} minutes.
          </div>
          <label>
            Code temporaire
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              className="field"
            />
          </label>
        </>
      ) : (
        <>
          <label>
            Email
            <input name="email" type="email" required className="field" />
          </label>
          <label>
            Mot de passe
            <input name="mot_de_passe" type="password" required className="field" />
          </label>
        </>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Connexion..." : challenge ? "Verifier le code" : "Connexion"}
      </Button>
      {challenge ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setChallenge(null);
            setError("");
          }}
        >
          Changer d&apos;identifiants
        </Button>
      ) : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
    </form>
  );
}
