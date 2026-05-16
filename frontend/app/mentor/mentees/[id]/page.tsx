import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorMenteeWorkspace } from "@/components/mentor/mentorship/MentorMenteeWorkspace";
import { Button } from "@/components/ui/button";

export default async function MentorMenteeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="grid gap-6">
      <MentorPageHeader
        title="Dossier mentoré"
        description="Séances, commentaires et avancement."
        helpModuleKey="mentor_mentee_file"
        actions={
          <Button asChild variant="outline">
            <Link href="/mentor/mentees">
              <ArrowLeft aria-hidden="true" />
              Retour
            </Link>
          </Button>
        }
      />
      <MentorMenteeWorkspace menteeId={Number(id)} />
    </div>
  );
}
