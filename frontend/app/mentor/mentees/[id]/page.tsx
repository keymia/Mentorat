import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorMenteeWorkspace } from "@/components/mentor/mentorship/MentorMenteeWorkspace";

export default async function MentorMenteeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="grid gap-6">
      <MentorPageHeader title="Dossier mentore" description="Seances, commentaires et avancement." />
      <MentorMenteeWorkspace menteeId={Number(id)} />
    </div>
  );
}
