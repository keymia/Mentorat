import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorSettingsPanel } from "@/components/mentor/MentorSettingsPanel";

export default function MentorSettingsPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader
        title="Parametres"
        description="Modifiez vos coordonnees et votre mot de passe."
      />
      <MentorSettingsPanel />
    </div>
  );
}
