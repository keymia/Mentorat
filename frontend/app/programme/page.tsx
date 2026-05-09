import { CheckCircle2 } from "lucide-react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  "Inscription du mentor ou du mentore",
  "Filtrage automatique des mentors admissibles",
  "Validation administrative",
  "Jumelage actif et suivi des statistiques",
];

export default function ProgrammePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Programme"
        title="Un parcours construit autour des niveaux academiques"
        description="La regle centrale est volontairement stricte: un mentore choisit uniquement un mentor du niveau superieur direct."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <ol className="grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step}>
              <Card className="h-full">
                <CardContent className="grid gap-4 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-primary">0{index + 1}</p>
                    <CheckCircle2 className="size-5 text-accent" aria-hidden="true" />
                  </div>
                  <p className="font-medium text-foreground">{step}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
