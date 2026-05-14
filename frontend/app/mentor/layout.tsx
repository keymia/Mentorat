import type { ReactNode } from "react";
import { Suspense } from "react";

import { MentorShell } from "@/components/mentor/MentorShell";

export default function MentorLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MentorShell>{children}</MentorShell>
    </Suspense>
  );
}
