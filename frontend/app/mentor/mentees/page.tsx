import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorMenteesList } from "@/components/mentor/mentorship/MentorMenteesList";

export default function MentorMenteesPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader
        title="Mes mentorés"
        description="Dossiers, séances et progression par mentoré."
        helpModuleKey="mentor_mentees"
      />
      <MentorMenteesList />
    </div>
  );
}
