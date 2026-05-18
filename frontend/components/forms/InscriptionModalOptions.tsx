"use client";

import { ArrowRight, GraduationCap, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useHydrated } from "@/components/layout/useHydrated";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

import { MentorForm } from "./MentorForm";
import { MentoreForm } from "./MentoreForm";

type FormType = "mentor" | "mentore";
type InscriptionModalOptionsProps = {
  variant?: "cards" | "hero";
};

function parseFormType(value: string | null): FormType | null {
  if (value === "mentor" || value === "mentore") {
    return value;
  }
  return null;
}

const options = [
  {
    type: "mentor" as const,
    icon: HeartHandshake,
    title: "Formulaire mentor",
    text: "Pour les étudiants admissibles qui souhaitent accompagner.",
    action: "Ouvrir le formulaire mentor",
  },
  {
    type: "mentore" as const,
    icon: GraduationCap,
    title: "Formulaire mentoré",
    text: "Pour choisir un mentor du niveau académique supérieur direct.",
    action: "Ouvrir le formulaire mentoré",
  },
];

export function InscriptionModalOptions({ variant = "cards" }: InscriptionModalOptionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHydrated = useHydrated();
  const activeForm = parseFormType(searchParams.get("form"));
  const translationGuardProps = !isHydrated ? { "data-no-translate": true } : {};

  function updateFormInUrl(form: FormType | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (form) {
      params.set("form", form);
    } else {
      params.delete("form");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function openForm(form: FormType) {
    updateFormInUrl(form);
  }

  function closeForm() {
    updateFormInUrl(null);
  }

  return (
    <div className="contents" {...translationGuardProps}>
      {variant === "hero" ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/inscriptions?form=mentore">
              Trouver un mentor
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/inscriptions?form=mentor">Devenir mentor</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {options.map((option) => (
            <Card key={option.type} className="h-full transition hover:-translate-y-1 hover:border-accent hover:shadow-soft">
              <CardContent className="grid h-full gap-4 p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <option.icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">{option.title}</h2>
                  <p className="mt-3 leading-7 text-muted-foreground">{option.text}</p>
                </div>
                <Button type="button" className="mt-auto w-fit" onClick={() => openForm(option.type)}>
                  <option.icon aria-hidden="true" />
                  {option.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={activeForm === "mentor"}
        title="Inscription mentor"
        description="Indiquez votre niveau académique et vos informations de profil."
        className="max-w-4xl"
        onClose={closeForm}
      >
        <MentorForm />
      </Modal>

      <Modal
        open={activeForm === "mentore"}
        title="Inscription mentoré"
        description="Choisissez la periode, votre niveau et un mentor disponible."
        className="max-w-4xl"
        onClose={closeForm}
      >
        <MentoreForm />
      </Modal>
    </div>
  );
}
