import { HeartHandshake, Scale, ShieldCheck, UsersRound } from "lucide-react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

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

export default function AboutPage() {
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
      </main>
      <SiteFooter />
    </div>
  );
}
