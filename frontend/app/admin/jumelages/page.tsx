import { AdminResourcePage } from "@/components/admin/AdminResourcePage";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminJumelagesPage() {
  return (
    <AdminShell>
      <AdminResourcePage title="Gestion jumelages" description="Mentorats actifs, termines ou suspendus." endpoint="/mentorat/" />
    </AdminShell>
  );
}
