import { MentoreForm } from "@/components/forms/MentoreForm";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function MentoreInscriptionPage() {
  return (
    <>
      <PageHeader
        eyebrow="Inscription mentoré"
        title="Choisir un mentor admissible"
        description="Après le choix du niveau académique, la liste affiche uniquement les mentors actifs du niveau supérieur direct ayant une capacité disponible."
      />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <MentoreForm />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
