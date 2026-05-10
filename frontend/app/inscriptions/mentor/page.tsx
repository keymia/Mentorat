import { MentorForm } from "@/components/forms/MentorForm";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function MentorInscriptionPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Inscription mentor"
        title="Devenir mentor"
        description="Indiquez votre niveau academique et la capacite de mentorat que vous pouvez assumer."
      />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <MentorForm />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
