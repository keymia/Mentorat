"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearStoredAuth } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();

  function logout() {
    clearStoredAuth();
    router.replace("/");
  }

  return (
    <Button type="button" onClick={logout} variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
      <LogOut aria-hidden="true" />
      Deconnexion
    </Button>
  );
}
