import { UsersRound } from "lucide-react";
import Image from "next/image";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicTeam } from "@/lib/api";
import type { TeamMember } from "@/lib/api";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function EquipesPage() {
  let members: TeamMember[] = [];
  try {
    members = await getPublicTeam();
  } catch {
    members = [];
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Equipes"
        title="Les mentors qui accompagnent la releve"
        description="Chaque profil affiche ici a ete complete par le mentor, accepte pour diffusion publique et valide par l'administration."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {members.length === 0 ? (
          <Card>
            <CardContent className="grid place-items-center gap-4 p-10 text-center">
              <UsersRound className="size-10 text-primary" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-semibold">Aucun mentor public pour le moment.</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Les profils seront ajoutes apres accord des mentors et validation administrative.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <article
                key={member.id}
                className="group relative min-h-[460px] overflow-hidden rounded-lg border border-border bg-muted shadow-card"
              >
                <div className="absolute inset-0">
                  {member.profile_photo_url ? (
                    <Image
                      src={member.profile_photo_url}
                      alt={member.nom_complet}
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      unoptimized
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--brand-ink)] text-5xl font-bold text-white">
                      {initials(member.nom_complet)}
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 grid gap-4 p-5 text-white sm:p-6">
                  <div className="grid gap-3">
                    <h2 className="text-2xl font-semibold leading-tight text-white">{member.nom_complet}</h2>
                    <div className="flex flex-wrap gap-2">
                      {member.academic_level ? (
                        <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                          {member.academic_level}
                        </span>
                      ) : null}
                      {member.domaine_specialite ? (
                        <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                          {member.domaine_specialite}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="line-clamp-6 text-sm leading-6 text-white/90">{member.mini_bio}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
