import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsersList } from "@/components/admin/AdminUsersList";

export default function AdminMentorsPage() {
  return (
    <AdminShell>
      <AdminUsersList
        title="Gestion mentors"
        description="Liste lisible des mentors et des profils mentor et mentore."
        endpoint="/mentors/"
        emptyMessage="Aucun mentor a afficher pour le moment."
        showCapacity
      />
    </AdminShell>
  );
}
