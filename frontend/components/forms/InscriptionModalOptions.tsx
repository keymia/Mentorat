"use client";

import { GraduationCap, HeartHandshake } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

import { MentorForm } from "./MentorForm";
import { MentoreForm } from "./MentoreForm";

type FormType = "mentor" | "mentore";

const options = [
  {
    type: "mentor" as const,
    icon: HeartHandshake,
    title: "Formulaire mentor",
    text: "Pour les etudiants admissibles qui souhaitent accompagner.",
    action: "Ouvrir le formulaire mentor",
  },
  {
    type: "mentore" as const,
    icon: GraduationCap,
    title: "Formulaire mentore",
    text: "Pour choisir un mentor du niveau academique superieur direct.",
    action: "Ouvrir le formulaire mentore",
  },
];

export function InscriptionModalOptions() {
  const [activeForm, setActiveForm] = useState<FormType | null>(null);

  return (
    <>
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
              <Button type="button" className="mt-auto w-fit" onClick={() => setActiveForm(option.type)}>
                <option.icon aria-hidden="true" />
                {option.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={activeForm === "mentor"}
        title="Inscription mentor"
        description="Indiquez votre niveau academique et votre capacite d'accompagnement."
        className="max-w-4xl"
        onClose={() => setActiveForm(null)}
      >
        <MentorForm />
      </Modal>

      <Modal
        open={activeForm === "mentore"}
        title="Inscription mentore"
        description="Choisissez la periode, votre niveau et un mentor disponible."
        className="max-w-4xl"
        onClose={() => setActiveForm(null)}
      >
        <MentoreForm />
      </Modal>
    </>
  );
}
