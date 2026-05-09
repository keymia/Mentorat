"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { formatApiError, login } from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await login(String(formData.get("email") ?? ""), String(formData.get("mot_de_passe") ?? ""));
      window.localStorage.setItem("mentorat_access", response.access);
      window.localStorage.setItem("mentorat_refresh", response.refresh);
      document.cookie = `mentorat_access=${response.access}; path=/; max-age=3600; SameSite=Lax`;
      router.push("/admin/dashboard");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label>
        Email
        <input name="email" type="email" required className="field" />
      </label>
      <label>
        Mot de passe
        <input name="mot_de_passe" type="password" required className="field" />
      </label>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Connexion..." : "Se connecter"}
      </Button>
      {error ? <Alert variant="error">{error}</Alert> : null}
    </form>
  );
}
