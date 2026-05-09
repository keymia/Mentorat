import { Mail, MapPin } from "lucide-react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Contact"
        title="Contacter l'equipe Mentorat"
        description="Cette page est un point d'entree simple pour les demandes liees au programme."
      />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Card>
          <CardContent className="grid gap-5 p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-secondary p-2 text-primary">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">Email</h2>
                <p className="mt-1 text-muted-foreground">contact@mentorat.local</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-secondary p-2 text-primary">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">Programme</h2>
                <p className="mt-1 text-muted-foreground">BMC - Association of Black Aspiring Physicians</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
