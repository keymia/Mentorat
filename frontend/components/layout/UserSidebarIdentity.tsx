"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { API_BASE_URL, getCurrentUser, type UtilisateurDetail } from "@/lib/api";
import { cn } from "@/lib/utils";

const SIDEBAR_IDENTITY_STORAGE_KEY = "mentorat_sidebar_identity";

type SidebarIdentity = {
  nom: string;
  prenom: string;
  photoUrl: string | null;
};

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("mentorat_access");
}

function isSessionTokenActive(token: string | null) {
  if (!token) {
    return false;
  }

  try {
    const tokenPayload = token.split(".")[1] ?? "";
    const normalizedPayload = tokenPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(paddedPayload)) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
}

function normalizePhotoUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const photoUrl = value.trim();
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return photoUrl;
  }

  return new URL(photoUrl, apiOrigin).toString();
}

function identityFromUser(user: UtilisateurDetail): SidebarIdentity {
  return {
    nom: user.nom ?? "",
    prenom: user.prenom ?? "",
    photoUrl:
      normalizePhotoUrl(user.profile_photo_url) ??
      normalizePhotoUrl(user.public_photo_url) ??
      normalizePhotoUrl(user.profile_photo) ??
      normalizePhotoUrl(user.public_photo),
  };
}

function readCachedIdentity() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(SIDEBAR_IDENTITY_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SidebarIdentity) : null;
  } catch {
    return null;
  }
}

function cacheIdentity(identity: SidebarIdentity) {
  try {
    window.sessionStorage.setItem(SIDEBAR_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // The sidebar can still render without cache if storage is unavailable.
  }
}

export function UserSidebarIdentity({ className }: { className?: string }) {
  const [identity, setIdentity] = useState<SidebarIdentity | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    window.queueMicrotask(() => {
      if (!isMounted) {
        return;
      }
      const cachedIdentity = readCachedIdentity();
      if (cachedIdentity) {
        setIdentity(cachedIdentity);
      }
      setIsSessionActive(isSessionTokenActive(getStoredToken()));
    });

    getCurrentUser()
      .then((user) => {
        if (!isMounted) {
          return;
        }
        const nextIdentity = identityFromUser(user);
        setIdentity(nextIdentity);
        setImageFailed(false);
        setIsSessionActive(true);
        cacheIdentity(nextIdentity);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setIsSessionActive(false);
        setIdentity(readCachedIdentity());
      });

    const sessionInterval = window.setInterval(() => {
      setIsSessionActive(isSessionTokenActive(getStoredToken()));
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(sessionInterval);
    };
  }, []);

  const displayName = [identity?.prenom, identity?.nom].filter(Boolean).join(" ").trim();

  if (!displayName) {
    return null;
  }

  const shouldShowPhoto = Boolean(identity?.photoUrl && !imageFailed);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-white shadow-sm backdrop-blur",
        className,
      )}
      data-no-translate
    >
      {shouldShowPhoto ? (
        <Image
          src={identity?.photoUrl ?? ""}
          alt=""
          width={36}
          height={36}
          unoptimized
          className="size-9 shrink-0 rounded-full border border-white/15 object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-5">{displayName}</span>
      <span
        aria-label={isSessionActive ? "Session active" : "Session expiree"}
        className={cn(
          "size-2.5 shrink-0 rounded-full ring-2 ring-white/15",
          isSessionActive ? "bg-emerald-400" : "bg-red-500",
        )}
      />
    </div>
  );
}
