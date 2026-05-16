import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsersList } from "@/components/admin/AdminUsersList";

export default function AdminMentoresPage() {
  return (
    <AdminShell>
      <AdminUsersList
        title="Gestion mentorés"
        description="Liste lisible des mentorés, avec possibilité de transformer un profil admissible en mentor."
        endpoint="/users/?profil_mentorat=MENTORE,MENTOR_ET_MENTORE"
        emptyMessage="Aucun mentoré à afficher pour le moment."
        defaultRoleName="MENTORE"
        defaultProfile="MENTORE"
        profileOptions={["MENTORE", "MENTOR_ET_MENTORE", "MENTOR"]}
        createButtonLabel="Créer un mentoré"
        helpModuleKey="mentees"
      />
    </AdminShell>
  );
}
