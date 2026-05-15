import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";

type PublicProfileCardProps = {
  name: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  badges?: Array<string | null | undefined>;
  minHeightClassName?: string;
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
}: PublicProfileCardProps) {
  const visibleBadges = badges.filter((badge): badge is string => Boolean(badge));

  return (
    <Card className={`group relative overflow-hidden bg-muted shadow-card ${minHeightClassName}`}>
      <div className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="h-full w-full object-cover transition duration-700 ease-out motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--brand-ink),var(--brand-red-strong))] text-5xl font-bold text-white">
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-bronze)]">{title}</p>
          ) : null}
          <h3 className="mt-2 text-2xl font-semibold leading-tight text-white">{name}</h3>
          {visibleBadges.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
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
          {description ? <p className="mt-3 line-clamp-6 text-sm leading-6 text-white/88">{description}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
