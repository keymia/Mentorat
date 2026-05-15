"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { getCurrentUser, type UtilisateurDetail } from "@/lib/api";

function accountTypeLabel(user: UtilisateurDetail | null) {
  if (user?.role_nom === "ADMIN_PRINCIPAL") {
    return "Administrateur principal";
  }
  if (user?.role_nom === "ADMIN_OPERATIONNEL") {
    return "Administrateur operationnel";
  }
  return "Administration";
}

export function AdminAccountTypeCard() {
  const [currentUser, setCurrentUser] = useState<UtilisateurDetail | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-black/15 p-3">
      <div className="flex items-center gap-2 text-[var(--brand-bronze)]">
        <ShieldCheck className="size-4" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">{accountTypeLabel(currentUser)}</p>
      </div>
    </div>
  );
}
