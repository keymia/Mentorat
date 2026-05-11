import { AdminShell } from "@/components/admin/AdminShell";
import { AdminMentorshipFollowUpCenter } from "@/components/admin/mentorship/AdminMentorshipFollowUpCenter";

export default function AdminMentorshipProgressPage() {
  return (
    <AdminShell>
      <AdminMentorshipFollowUpCenter />
    </AdminShell>
  );
}
