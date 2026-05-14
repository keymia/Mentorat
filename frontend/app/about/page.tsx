import { HeartHandshake, Scale, ShieldCheck, UsersRound } from "lucide-react";
import Image from "next/image";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicAboutTeam } from "@/lib/api";
import type { PublicAboutTeamMember } from "@/lib/api";

const pillars = [
  {
    icon: HeartHandshake,
    title: "Accompagnement",
    text: "Chaque mentore avance avec un mentor du niveau academique superieur direct.",
  },
  {
    icon: Scale,
    title: "Equite",
    text: "Les capacites de mentorat sont controlees pour proteger la qualite de l'accompagnement.",
  },
  {
    icon: ShieldCheck,
    title: "Gouvernance",
    text: "Les inscriptions et jumelages restent valides par l'administration.",
  },
  {
    icon: UsersRound,
    title: "Communaute",
    text: "La plateforme rend visibles les partenaires et les actions du programme.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AdminTeamCard({ member }: { member: PublicAboutTeamMember }) {
  if (!member.public_photo_url) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--brand-ink),var(--brand-red-strong))] text-4xl font-bold text-white shadow-card">
            {initials(member.nom_complet)}
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {member.public_title}
          </p>
          <h3 className="mt-2 text-xl font-semibold">{member.nom_complet}</h3>
          {member.public_description ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{member.public_description}</p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative min-h-[320px] overflow-hidden bg-muted shadow-card sm:min-h-[360px]">
      <Image
        src={member.public_photo_url}
        alt={member.nom_complet}
        fill
        unoptimized
        className="object-cover transition duration-700 ease-out motion-safe:group-hover:scale-105"
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(159,20,22,0.28),transparent_48%)]" />
      <CardContent className="relative z-10 flex min-h-[320px] items-end p-5 sm:min-h-[360px]">
        <div className="w-full rounded-lg border border-white/15 bg-black/28 p-4 text-white shadow-2xl backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-bronze)]">
            {member.public_title}
          </p>
          <h3 className="mt-2 text-2xl font-semibold leading-tight text-white">{member.nom_complet}</h3>
          {member.public_description ? (
            <p className="mt-3 line-clamp-5 text-sm leading-6 text-white/88">{member.public_description}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AboutPage() {
  const adminTeam = await getPublicAboutTeam().catch(() => []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="A propos"
        title="Un cadre de mentorat academique simple a administrer"
        description="Mentorat connecte les etudiants selon une progression academique claire, avec validation administrative et suivi des capacites."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((pillar) => (
            <Card key={pillar.title}>
              <CardContent className="grid gap-4 p-6">
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <pillar.icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">{pillar.title}</h2>
                  <p className="mt-3 leading-7 text-muted-foreground">{pillar.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {adminTeam.length > 0 ? (
          <section className="mt-12">
            <div className="mb-5">
              <h2 className="font-display text-3xl font-bold">Equipe administrative</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Les personnes qui coordonnent le fonctionnement operationnel du programme.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {adminTeam.map((member) => (
                <AdminTeamCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
