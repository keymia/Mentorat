import { AdminShell } from "@/components/admin/AdminShell";
import { AdminMentorshipAssignments } from "@/components/admin/mentorship/AdminMentorshipAssignments";

export default function AdminMentorshipAssignmentsPage() {
  return (
    <AdminShell>
      <AdminMentorshipAssignments />
    </AdminShell>
  );
}
