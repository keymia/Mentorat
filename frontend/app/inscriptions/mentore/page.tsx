import { MentoreForm } from "@/components/forms/MentoreForm";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function MentoreInscriptionPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Inscription mentore"
        title="Choisir un mentor admissible"
        description="Apres le choix du niveau academique, la liste affiche uniquement les mentors actifs du niveau superieur direct avec une capacite disponible."
      />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <MentoreForm />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
