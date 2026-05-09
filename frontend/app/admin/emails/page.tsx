import { AdminResourcePage } from "@/components/admin/AdminResourcePage";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminEmailsPage() {
  return (
    <AdminShell>
      <AdminResourcePage title="Gestion emails" description="Suivi des emails automatiques." endpoint="/emails/" />
    </AdminShell>
  );
}
