"use client";

import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HelpModuleView } from "@/components/help/HelpModuleView";
import { useHelpLanguage } from "@/components/help/useHelpLanguage";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { getCurrentUser } from "@/lib/api";
import { HelpModuleKey, HelpRole, HelpScope, getHelpModule, helpUiText, normalizeHelpRole } from "@/lib/helpContent";

type HelpIconButtonProps = {
  moduleKey: HelpModuleKey;
  scope: HelpScope;
  className?: string;
};

export function HelpIconButton({ moduleKey, scope, className }: HelpIconButtonProps) {
  const language = useHelpLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<HelpRole | undefined>(scope === "mentor" ? "MENTOR" : undefined);
  const helpModule = useMemo(() => getHelpModule(moduleKey, language), [language, moduleKey]);
  const ui = helpUiText[language];

  useEffect(() => {
    if (scope !== "admin") {
      return;
    }
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setRole(normalizeHelpRole(user.role_nom, scope));
        }
      })
      .catch(() => {
        if (isMounted) {
          setRole(undefined);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [scope]);

  if (!helpModule) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={className}
        aria-label={ui.helpAria(helpModule.title)}
        title={ui.helpAria(helpModule.title)}
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle aria-hidden="true" />
      </Button>

      <Modal
        open={isOpen}
        title={ui.helpAria(helpModule.title)}
        description={ui.modalDescription}
        closeLabel={ui.close}
        className="max-w-3xl"
        onClose={() => setIsOpen(false)}
      >
        <div data-no-translate className="grid gap-5">
          <HelpModuleView module={helpModule} role={role} compact language={language} />
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              {ui.close}
            </Button>
            <Button asChild>
              <Link href={scope === "mentor" ? "/mentor/help" : "/admin/help"}>{ui.viewAllDocumentation}</Link>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
