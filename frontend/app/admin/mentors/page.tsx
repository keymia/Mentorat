import { AdminUsersList } from "@/components/admin/AdminUsersList";

export default function AdminMentorsPage() {
  return (
    <AdminUsersList
      title="Gestion mentors"
      description="Liste lisible des mentors et des profils mentor et mentoré."
      endpoint="/mentors/"
      emptyMessage="Aucun mentor à afficher pour le moment."
      defaultRoleName="MENTOR"
      defaultProfile="MENTOR"
      profileOptions={["MENTOR", "MENTOR_ET_MENTORE"]}
      createButtonLabel="Créer un mentor"
      helpModuleKey="mentors"
    />
  );
}
