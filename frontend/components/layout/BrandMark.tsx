import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  inverse?: boolean;
};

export function BrandMark({ href = "/", compact = false, className, inverse = false }: BrandMarkProps) {
  const content = (
    <span className={cn("flex items-center gap-3", className)}>
      <span className="relative flex h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--brand-cream)] shadow-card ring-1 ring-border">
        <Image
          src="/bmm-logo.jpeg"
          alt="BMM - Black Med Mentorship"
          fill
          sizes="56px"
          className="object-contain p-1"
          priority
        />
      </span>
      {!compact ? (
        <span className="grid leading-tight">
          <span className={cn("font-display text-lg font-bold tracking-normal", inverse ? "text-white" : "text-foreground")}>
            BMM
          </span>
          <span
            className={cn(
              "text-xs font-semibold tracking-normal",
              inverse ? "text-white/62" : "text-muted-foreground",
            )}
          >
            Black Med Mentorship
          </span>
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </Link>
  );
}
