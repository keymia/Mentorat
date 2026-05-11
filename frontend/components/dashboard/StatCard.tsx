import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "red" | "bronze" | "dark";
  helper?: string;
};

const tones = {
  red: "bg-primary text-primary-foreground",
  bronze: "bg-[var(--brand-bronze-soft)] text-[var(--brand-brown)]",
  dark: "bg-[var(--brand-ink)] text-white",
};

export function StatCard({ label, value, icon: Icon, tone = "red", helper }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-4xl font-bold text-foreground">{value}</p>
          </div>
          <span className={cn("flex size-11 items-center justify-center rounded-xl", tones[tone])}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </div>
        {helper ? <p className="mt-4 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
