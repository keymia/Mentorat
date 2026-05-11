import type { ReactNode } from "react";

type MentorPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function MentorPageHeader({ title, description, actions }: MentorPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Espace mentor</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
