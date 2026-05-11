"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  function logout() {
    window.localStorage.removeItem("mentorat_access");
    window.localStorage.removeItem("mentorat_refresh");
    document.cookie = "mentorat_access=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "mentorat_home=; path=/; max-age=0; SameSite=Lax";
    router.push("/admin/login");
  }

  return (
    <Button type="button" onClick={logout} variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
      <LogOut aria-hidden="true" />
      Deconnexion
    </Button>
  );
}
