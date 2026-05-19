import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PublicProfileCardProps = {
  name: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  badges?: Array<string | null | undefined>;
  minHeightClassName?: string;
  cardClassName?: string;
  nameClassName?: string;
  descriptionClassName?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PublicProfileCard({
  name,
  title,
  description,
  imageUrl,
  badges = [],
  minHeightClassName = "min-h-[420px]",
  cardClassName,
  nameClassName,
  descriptionClassName,
}: PublicProfileCardProps) {
  const visibleBadges = badges.filter((badge): badge is string => Boolean(badge));

  return (
    <Card
      className={cn(
        "public-motion-card group relative overflow-hidden bg-muted shadow-card",
        minHeightClassName,
        cardClassName,
      )}
    >
      <div className="reveal-image absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="public-motion-image h-full w-full object-cover"
          />
        ) : (
          <div className="public-motion-image flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--brand-ink),var(--brand-red-strong))] text-5xl font-bold text-white">
            {initials(name)}
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/46 to-black/12" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(159,20,22,0.28),transparent_46%)] opacity-90 transition duration-500 group-hover:opacity-100" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/12 to-transparent opacity-60" />
      <CardContent className="relative z-10 flex min-h-[inherit] items-end p-5 sm:p-6">
        <div className="w-full rounded-lg border border-white/15 bg-black/30 p-4 text-white shadow-2xl backdrop-blur-md">
          {title ? (
            <p className="reveal-actions text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-bronze)]">{title}</p>
          ) : null}
          <h3 className={cn("reveal-title mt-2 text-2xl font-semibold leading-tight text-white", nameClassName)}>{name}</h3>
          {visibleBadges.length > 0 ? (
            <div className="reveal-actions mt-3 flex flex-wrap gap-2">
              {visibleBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/25 bg-white/14 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
          {description ? (
            <p className={cn("reveal-description mt-3 line-clamp-6 text-sm leading-6 text-white/88", descriptionClassName)}>
              {description}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
