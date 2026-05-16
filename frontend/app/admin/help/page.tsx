import { AdminShell } from "@/components/admin/AdminShell";
import { HelpPage } from "@/components/help/HelpPage";

export default function AdminHelpPage() {
  return (
    <AdminShell>
      <HelpPage scope="admin" />
    </AdminShell>
  );
}
