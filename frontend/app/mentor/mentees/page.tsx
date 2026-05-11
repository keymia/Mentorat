import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorMenteesList } from "@/components/mentor/mentorship/MentorMenteesList";

export default function MentorMenteesPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader title="Mes mentores" description="Dossiers, seances et progression par mentore." />
      <MentorMenteesList />
    </div>
  );
}
