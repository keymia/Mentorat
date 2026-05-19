import { HeartHandshake, Scale, ShieldCheck, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { PublicProfileCard } from "@/components/public/PublicProfileCard";
import { RevealOnScroll } from "@/components/public/RevealOnScroll";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicAboutTeam } from "@/lib/api";
import type { PublicAboutTeamMember } from "@/lib/api";

const pillars = [
  {
    icon: HeartHandshake,
    title: "Accompagnement",
    text: "Chaque mentoré progresse avec un mentor du niveau académique supérieur direct.",
  },
  {
    icon: Scale,
    title: "Equite",
    text: "Les capacités de mentorat sont contrôlées afin de préserver la qualité de l’accompagnement.",
  },
  {
    icon: ShieldCheck,
    title: "Gouvernance",
    text: "Les inscriptions et les jumelages restent validés par l’administration.",
  },
  {
    icon: UsersRound,
    title: "Communaute",
    text: "La plateforme rend visibles les partenaires et les actions du programme.",
  },
];

function AdminTeamCard({ member }: { member: PublicAboutTeamMember }) {
  return (
    <PublicProfileCard
      name={member.public_display_name || member.nom_complet}
      description={member.public_description}
      imageUrl={member.public_photo_url}
      minHeightClassName="min-h-[360px]"
      nameClassName="text-[var(--brand-bronze)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
      descriptionClassName="text-white/78"
    />
  );
}

export default async function AboutPage() {
  const adminTeam = await getPublicAboutTeam().catch(() => []);

  return (
    <>
      <PageHeader
        eyebrow="À propos"
        title="Un cadre de mentorat académique simple à administrer"
        description="Mentorat relie les étudiants selon une progression académique claire, avec validation administrative et suivi des capacités."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((pillar, index) => (
            <RevealOnScroll key={pillar.title} delayMs={index * 140}>
              <Card className="public-motion-card group">
                <CardContent className="grid gap-4 p-6">
                  <div className="reveal-image flex size-11 items-center justify-center rounded-xl bg-secondary text-primary transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <pillar.icon className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="reveal-title font-display text-2xl font-bold">{pillar.title}</h2>
                    <p className="reveal-description mt-3 leading-7 text-muted-foreground">{pillar.text}</p>
                  </div>
                </CardContent>
              </Card>
            </RevealOnScroll>
          ))}
        </div>
        {adminTeam.length > 0 ? (
          <section className="mt-12">
            <RevealOnScroll className="mb-5">
              <h2 className="reveal-title font-display text-3xl font-bold">Equipe administrative</h2>
              <p className="reveal-description mt-2 text-sm leading-6 text-muted-foreground">
                Les personnes qui coordonnent le fonctionnement operationnel du programme.
              </p>
            </RevealOnScroll>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {adminTeam.map((member, index) => (
                <RevealOnScroll key={member.id} delayMs={index * 140}>
                  <AdminTeamCard member={member} />
                </RevealOnScroll>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
