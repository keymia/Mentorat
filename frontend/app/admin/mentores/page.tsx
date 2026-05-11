import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsersList } from "@/components/admin/AdminUsersList";

export default function AdminMentoresPage() {
  return (
    <AdminShell>
      <AdminUsersList
        title="Gestion mentores"
        description="Liste lisible des mentores et des profils mentor et mentore."
        endpoint="/users/?profil_mentorat=MENTORE,MENTOR_ET_MENTORE"
        emptyMessage="Aucun mentore a afficher pour le moment."
        defaultRoleName="MENTORE"
        defaultProfile="MENTORE"
        profileOptions={["MENTORE", "MENTOR_ET_MENTORE"]}
        createButtonLabel="Creer un mentore"
      />
    </AdminShell>
  );
}
