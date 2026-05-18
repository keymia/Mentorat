import { MentorForm } from "@/components/forms/MentorForm";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function MentorInscriptionPage() {
  return (
    <>
      <PageHeader
        eyebrow="Inscription mentor"
        title="Devenir mentor"
        description="Indiquez votre niveau académique et les informations utiles à votre profil mentor."
      />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <MentorForm />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
