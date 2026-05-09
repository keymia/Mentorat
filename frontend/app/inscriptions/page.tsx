import { GraduationCap, HeartHandshake } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

const options = [
  {
    href: "/inscriptions/mentor",
    icon: HeartHandshake,
    title: "Formulaire mentor",
    text: "Pour les etudiants admissibles qui souhaitent accompagner.",
  },
  {
    href: "/inscriptions/mentore",
    icon: GraduationCap,
    title: "Formulaire mentore",
    text: "Pour choisir un mentor du niveau academique superieur direct.",
  },
];

export default function InscriptionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Inscriptions"
        title="Choisir le bon formulaire"
        description="Les inscriptions sont creees en attente, puis validees par l'administration."
      />
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-2">
        {options.map((option) => (
          <Link key={option.href} href={option.href} className="group block">
            <Card className="h-full transition group-hover:-translate-y-1 group-hover:border-accent group-hover:shadow-soft">
              <CardContent className="grid gap-4 p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <option.icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">{option.title}</h2>
                  <p className="mt-3 leading-7 text-muted-foreground">{option.text}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
