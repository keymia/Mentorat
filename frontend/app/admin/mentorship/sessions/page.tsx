import { AdminShell } from "@/components/admin/AdminShell";
import { AdminMentorshipSessions } from "@/components/admin/mentorship/AdminMentorshipSessions";

export default function AdminMentorshipSessionsPage() {
  return (
    <AdminShell>
      <AdminMentorshipSessions />
    </AdminShell>
  );
}
