import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/layout/PageHeader";

export default function MentoreBookingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Espace mentoré"
        title="Reservations automatiques desactivees"
        description="Les rencontres sont maintenant programmées par le mentor dans le cadre de la période active."
      />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Alert variant="info">
          Votre mentor vous communiquera les dates des seances. Les commentaires et suivis sont geres par le mentor et visibles par
          l&apos;administration.
        </Alert>
      </main>
    </>
  );
}
