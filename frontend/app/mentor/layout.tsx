import type { ReactNode } from "react";

import { MentorShell } from "@/components/mentor/MentorShell";

export default function MentorLayout({ children }: { children: ReactNode }) {
  return <MentorShell>{children}</MentorShell>;
}
