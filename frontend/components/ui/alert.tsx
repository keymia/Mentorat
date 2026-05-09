import * as React from "react";

import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "error" | "warning";

const variants: Record<AlertVariant, string> = {
  info: "border-border bg-muted text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
};

export function Alert({
  className,
  variant = "info",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return <div className={cn("rounded-xl border px-4 py-3 text-sm leading-6", variants[variant], className)} {...props} />;
}
