import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorSessionsList } from "@/components/mentor/mentorship/MentorSessionsList";

export default function MentorSessionsPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader title="Mes seances" description="Rencontres programmees, realisees et a mettre a jour." />
      <MentorSessionsList />
    </div>
  );
}
