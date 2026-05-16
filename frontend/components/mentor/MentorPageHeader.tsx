import type { ReactNode } from "react";

import { HelpIconButton } from "@/components/help/HelpIconButton";
import type { HelpModuleKey } from "@/lib/helpContent";

type MentorPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  helpModuleKey?: HelpModuleKey;
};

export function MentorPageHeader({ title, description, actions, helpModuleKey }: MentorPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Espace mentor</p>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">{title}</h1>
          {helpModuleKey ? <HelpIconButton moduleKey={helpModuleKey} scope="mentor" /> : null}
        </div>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
