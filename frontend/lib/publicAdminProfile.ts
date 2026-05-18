export const PUBLIC_APPELLATIONS = ["Dr", "Dre", "M.", "Mme", "Pr", "Pre"] as const;

export const PUBLIC_TITLE_OPTIONS = ["MD", "PhD", "B.Sc.", "M.Sc.", "MA", "MAEd", "Autre"] as const;

export const CUSTOM_PUBLIC_TITLE_OPTION = "Autre";

export type PublicAppellation = (typeof PUBLIC_APPELLATIONS)[number] | "";
export type PublicTitleOption = (typeof PUBLIC_TITLE_OPTIONS)[number];

export function splitPublicTitles(value?: string | null): {
  publicTitleChoices: PublicTitleOption[];
  customPublicTitle: string;
} {
  const title = value?.trim() ?? "";
  if (!title) {
    return { publicTitleChoices: [], customPublicTitle: "" };
  }

  const knownOptions = new Set<string>(PUBLIC_TITLE_OPTIONS.filter((option) => option !== CUSTOM_PUBLIC_TITLE_OPTION));
  const choices: PublicTitleOption[] = [];
  const customTitles: string[] = [];

  title
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      if (knownOptions.has(part)) {
        if (!choices.includes(part as PublicTitleOption)) {
          choices.push(part as PublicTitleOption);
        }
      } else {
        customTitles.push(part);
      }
    });

  if (customTitles.length > 0 && !choices.includes(CUSTOM_PUBLIC_TITLE_OPTION)) {
    choices.push(CUSTOM_PUBLIC_TITLE_OPTION);
  }

  return { publicTitleChoices: choices, customPublicTitle: customTitles.join(", ") };
}

export function resolvePublicTitles(choices: PublicTitleOption[], customTitle: string) {
  const titles: string[] = choices.filter((choice) => choice && choice !== CUSTOM_PUBLIC_TITLE_OPTION);
  const custom = customTitle.trim();
  if (choices.includes(CUSTOM_PUBLIC_TITLE_OPTION) && custom) {
    titles.push(custom);
  }
  return Array.from(new Set(titles)).join(", ");
}

export function formatAdminPublicIdentity({
  appellation,
  prenom,
  nom,
  title,
}: {
  appellation?: string | null;
  prenom?: string | null;
  nom?: string | null;
  title?: string | null;
}) {
  const identity = [appellation, prenom, nom].filter(Boolean).join(" ").trim();
  const diploma = title?.trim();
  if (!identity) {
    return diploma || "Non renseigné";
  }
  return diploma ? `${identity}, ${diploma}` : identity;
}
