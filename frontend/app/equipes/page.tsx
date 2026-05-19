import { GraduationCap, HeartPulse, ShieldCheck, UsersRound } from "lucide-react";
import Image from "next/image";

import { PageHeader } from "@/components/PageHeader";
import { RevealOnScroll } from "@/components/public/RevealOnScroll";
import { Badge } from "@/components/ui/badge";
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

function TeamMemberCard({ member }: { member: TeamMember }) {
  const level = member.academic_level || member.niveau_academique_nom || "Niveau à confirmer";
  const speciality = member.domaine_specialite || "Mentorat académique";

  return (
    <article className="public-motion-card group overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-card">
      <div className="reveal-image relative aspect-[4/3] overflow-hidden bg-muted">
        {member.profile_photo_url ? (
          <Image
            src={member.profile_photo_url}
            alt={member.nom_complet}
            fill
            unoptimized
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="public-motion-image h-full w-full object-cover"
          />
        ) : (
          <div className="public-motion-image flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--brand-ink),var(--brand-red-strong))] text-5xl font-bold text-white">
            {initials(member.nom_complet)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(159,20,22,0.26),transparent_45%)] opacity-0 transition duration-500 group-hover:opacity-100" />
        <div className="absolute left-4 top-4">
          <Badge variant="bronze">Mentor BMM</Badge>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div>
          <h2 className="reveal-title font-display text-2xl font-bold leading-tight text-foreground">{member.nom_complet}</h2>
          <p className="reveal-description mt-2 text-sm font-semibold text-primary">{speciality}</p>
        </div>

        <div className="reveal-actions grid gap-3 rounded-lg border border-border bg-muted/45 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <GraduationCap className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Niveau académique</p>
              <p className="mt-1 text-sm font-medium text-foreground">{level}</p>
            </div>
          </div>
        </div>

        <p className="reveal-description line-clamp-6 text-sm leading-7 text-muted-foreground">
          {member.mini_bio || "Ce mentor accompagne les futurs professionnels de la santé avec un engagement validé par l’administration."}
        </p>
      </div>
    </article>
  );
}

export default async function EquipesPage() {
  let members: TeamMember[] = [];
  try {
    members = await getPublicTeam();
  } catch {
    members = [];
  }

  return (
    <>
      <PageHeader
        eyebrow="Équipes"
        title="Les mentors qui accompagnent la relève"
        description="Chaque profil affiché ici a été complété par le mentor, accepté pour diffusion publique et validé par l’administration."
      />
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6">
        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <RevealOnScroll className="h-full">
            <div className="public-motion-card h-full rounded-xl border border-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--secondary)_70%,transparent))] p-6 shadow-card">
              <Badge variant="bronze" className="reveal-child">Communauté mentorale</Badge>
              <h2 className="reveal-title mt-4 font-display text-3xl font-bold leading-tight text-foreground">
                Des profils validés, lisibles et alignés avec le parcours académique.
              </h2>
              <p className="reveal-description mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                La page Équipes met en valeur les mentors qui ont choisi d’apparaître publiquement. Chaque carte distingue
                clairement le nom, le domaine, le niveau académique et la mini bio afin de faciliter la compréhension du
                parcours de chaque personne.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="h-full" delayMs={90}>
            <div className="public-motion-card grid h-full gap-3 rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="reveal-title flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <UsersRound className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-foreground">{members.length}</p>
                  <p className="text-sm text-muted-foreground">mentor{members.length > 1 ? "s" : ""} public{members.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="reveal-description grid gap-3 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                <p className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Profils approuvés par l’administration.
                </p>
                <p className="flex gap-2">
                  <HeartPulse className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Présentation pensée pour le mentorat médical et académique.
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </section>

        {members.length === 0 ? (
          <RevealOnScroll>
            <Card>
              <CardContent className="grid place-items-center gap-4 p-10 text-center">
                <UsersRound className="size-10 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-semibold">Aucun mentor public pour le moment.</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Les profils seront ajoutés après accord des mentors et validation administrative.
                  </p>
                </div>
              </CardContent>
            </Card>
          </RevealOnScroll>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member, index) => (
              <RevealOnScroll key={member.id} delayMs={(index % 3) * 90}>
                <TeamMemberCard member={member} />
              </RevealOnScroll>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
