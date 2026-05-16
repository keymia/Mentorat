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
    text: "Mentors inscrits, validés et suivis par l’administration.",
  },
  {
    icon: GraduationCap,
    title: "Progression claire",
    text: "Choix du mentor selon le niveau académique supérieur direct.",
  },
  {
    icon: UsersRound,
    title: "Communaute",
    text: "Partenaires publics et suivi du programme dans un tableau de bord.",
  },
];

const steps = [
  "Inscription mentor ou mentoré",
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
            className="absolute inset-0 h-full w-full object-cover brightness-[0.86] contrast-[1.18] saturate-[1.12] transition duration-500 dark:brightness-[0.42] dark:contrast-[1.32] dark:saturate-[0.88]"
            src="/videos/accueil-final.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(3,2,2,0.99)_0%,rgba(8,4,4,0.94)_30%,rgba(69,20,20,0.76)_56%,rgba(255,241,220,0.30)_82%,rgba(255,241,220,0.14)_100%)] transition-colors duration-500 dark:bg-[linear-gradient(100deg,rgba(0,0,0,0.995)_0%,rgba(0,0,0,0.96)_32%,rgba(0,0,0,0.80)_60%,rgba(0,0,0,0.56)_82%,rgba(0,0,0,0.36)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_45%,rgba(159,20,22,0.58),transparent_48%),radial-gradient(circle_at_78%_14%,rgba(255,246,232,0.50),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.03)_58%,rgba(20,10,8,0.38)_100%)] opacity-100 mix-blend-soft-light transition-opacity duration-500 dark:opacity-0" />
          <div className="absolute inset-0 opacity-0 mix-blend-normal transition-opacity duration-500 dark:opacity-100 dark:bg-[radial-gradient(ellipse_at_18%_45%,rgba(159,20,22,0.46),transparent_48%),radial-gradient(circle_at_72%_16%,rgba(183,131,75,0.42),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.70)_100%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
            <Reveal>
              <Badge variant="bronze" className="border-white/20 bg-white/12 text-white shadow-card backdrop-blur">
                Association of Black Aspiring Physicians
              </Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-normal text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.48)] sm:text-6xl">
                <span className="font-display">Mentorer, soutenir et élever la relève académique.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/88 drop-shadow-[0_2px_14px_rgba(0,0,0,0.42)]">
                BMC Mentorat relie mentors et mentorés dans un cadre exigeant, humain et structuré autour de la
                progression académique.
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
                  <span className="text-sm font-semibold uppercase tracking-[0.18em]">Mentorat académique</span>
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold">Prêt à rejoindre le réseau BMC ?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                  Inscrivez-vous comme mentor ou mentoré. L&apos;administration valide ensuite les profils et les jumelages.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link href="/equipes">
                    <BookOpenCheck aria-hidden="true" />
                    Voir les équipes
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
