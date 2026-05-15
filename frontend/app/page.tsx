import { BookOpenCheck, GraduationCap, HeartHandshake, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { InscriptionModalOptions } from "@/components/forms/InscriptionModalOptions";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";

const highlights = [
  {
    icon: ShieldCheck,
    title: "Cadre fiable",
    text: "Mentors inscrits, valides et suivis par l'administration.",
  },
  {
    icon: GraduationCap,
    title: "Progression claire",
    text: "Choix du mentor selon le niveau academique superieur direct.",
  },
  {
    icon: UsersRound,
    title: "Communaute",
    text: "Partenaires publics et suivi du programme dans un tableau de bord.",
  },
];

const steps = [
  "Inscription mentor ou mentore",
  "Filtrage automatique des mentors admissibles",
  "Validation administrative",
  "Jumelage actif et suivi des statistiques",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-border bg-[var(--brand-ink)] text-white">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/videos/accueil-final.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/28 dark:bg-black/45" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.88)_0%,rgba(10,10,10,0.72)_34%,rgba(10,10,10,0.36)_68%,rgba(10,10,10,0.18)_100%)]" />
          <div className="absolute inset-y-0 left-0 w-full max-w-4xl bg-gradient-to-r from-black/55 via-black/24 to-transparent backdrop-blur-sm" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_16%,rgba(183,131,75,0.24),transparent_32%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
            <Reveal>
              <Badge variant="bronze" className="border-white/20 bg-white/12 text-white shadow-card backdrop-blur">
                Association of Black Aspiring Physicians
              </Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-normal text-white sm:text-6xl">
                <span className="font-display">Mentorer, soutenir et elever la releve academique.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/86">
                BMC Mentorat connecte mentors et mentores dans un cadre exigeant, humain et structure autour de la
                progression academique.
              </p>
              <Suspense fallback={null}>
                <InscriptionModalOptions variant="hero" />
              </Suspense>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
          {highlights.map((highlight, index) => (
            <Reveal key={highlight.title} delay={index * 0.08}>
              <Card className="h-full">
                <CardContent className="grid gap-4 p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <highlight.icon className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">{highlight.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{highlight.text}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <Badge variant="secondary">Flux principal</Badge>
              <h2 className="mt-4 font-display text-3xl font-bold">Un parcours simple, verifie et mesurable.</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                La plateforme applique les regles metier au moment de l&apos;inscription et au moment de la validation
                administrative.
              </p>
            </div>
            <div className="grid gap-3">
              {steps.map((step, index) => (
                <Card key={step} className="bg-background/70">
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <p className="font-medium text-foreground">{step}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Card className="overflow-hidden bg-[var(--brand-ink)] text-white">
            <CardContent className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-[var(--brand-bronze)]">
                  <HeartHandshake className="size-5" aria-hidden="true" />
                  <span className="text-sm font-semibold uppercase tracking-[0.18em]">Mentorat academique</span>
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold">Pret a rejoindre le reseau BMC ?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                  Inscrivez-vous comme mentor ou mentore. L&apos;administration valide ensuite les profils et les jumelages.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link href="/equipes">
                    <BookOpenCheck aria-hidden="true" />
                    Voir les equipes
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/inscriptions">S&apos;inscrire</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
