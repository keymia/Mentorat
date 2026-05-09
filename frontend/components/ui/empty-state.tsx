import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-start gap-3 p-6">
        {Icon ? (
          <div className="rounded-lg bg-secondary p-2 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </div>
        ) : null}
        <div>
          <p className="font-semibold text-card-foreground">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
