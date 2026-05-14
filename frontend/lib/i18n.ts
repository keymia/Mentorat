export type Language = "fr" | "en";

export const LANGUAGE_STORAGE_KEY = "bmc-language";

const englishDictionary: Record<string, string> = {
  Accueil: "Home",
  "A propos": "About",
  Programme: "Program",
  Equipes: "Team",
  Inscriptions: "Registration",
  Evenements: "Events",
  Partenaires: "Partners",
  Contact: "Contact",
  Connexion: "Sign in",
  "Fermer le menu": "Close menu",
  "Ouvrir le menu": "Open menu",
  "Ouvrir le menu mentor": "Open mentor menu",
  "Fermer le menu mentor": "Close mentor menu",
  "Navigation principale": "Main navigation",
  "Navigation mobile": "Mobile navigation",
  "Navigation mentor": "Mentor navigation",
  "Navigation compte mentor": "Mentor account navigation",
  "Navigation admin": "Admin navigation",
  "Association of Black Aspiring Physicians": "Association of Black Aspiring Physicians",
  "Mentorer, soutenir et elever la releve academique.": "Mentor, support, and uplift the next academic generation.",
  "BMC Mentorat connecte mentors et mentores dans un cadre exigeant, humain et structure autour de la progression academique.":
    "BMC Mentorship connects mentors and mentees in a rigorous, human-centered, and structured framework built around academic progress.",
  "Trouver un mentor": "Find a mentor",
  "Cadre fiable": "Trusted framework",
  "Mentors inscrits, valides et suivis par l'administration.": "Mentors are registered, validated, and monitored by the administration.",
  "Progression claire": "Clear progression",
  "Choix du mentor selon le niveau academique superieur direct.": "Mentor selection based on the directly higher academic level.",
  Communaute: "Community",
  "Partenaires publics et suivi du programme dans un tableau de bord.": "Public partners and program tracking in one dashboard.",
  "Flux principal": "Main flow",
  "Un parcours simple, verifie et mesurable.": "A simple, verified, and measurable journey.",
  "La plateforme applique les regles metier au moment de l'inscription et au moment de la validation administrative.":
    "The platform applies business rules during registration and during administrative validation.",
  "Inscription mentor ou mentore": "Mentor or mentee registration",
  "Inscription du mentor ou du mentore": "Mentor or mentee registration",
  "Filtrage automatique des mentors admissibles": "Automatic filtering of eligible mentors",
  "Validation administrative": "Administrative approval",
  "Jumelage actif et suivi des statistiques": "Active matching and statistics tracking",
  "Mentorat academique": "Academic mentorship",
  "Pret a rejoindre le reseau BMC ?": "Ready to join the BMC network?",
  "Inscrivez-vous comme mentor ou mentore. L'administration valide ensuite les profils et les jumelages.":
    "Register as a mentor or mentee. The administration then validates profiles and matches.",
  "Voir le programme": "View the program",
  "Voir les equipes": "View the team",
  "S'inscrire": "Register",
  "Choisir le bon formulaire": "Choose the right form",
  "Les inscriptions sont creees en attente, puis validees par l'administration.":
    "Registrations are created as pending, then validated by the administration.",
  "Formulaire mentor": "Mentor form",
  "Pour les etudiants admissibles qui souhaitent accompagner.": "For eligible students who want to mentor others.",
  "Ouvrir le formulaire mentor": "Open mentor form",
  "Formulaire mentore": "Mentee form",
  "Pour choisir un mentor du niveau academique superieur direct.": "To choose a mentor from the directly higher academic level.",
  "Ouvrir le formulaire mentore": "Open mentee form",
  "Inscription mentor": "Mentor registration",
  "Indiquez votre niveau academique et vos informations de profil.": "Provide your academic level and profile information.",
  "Inscription mentore": "Mentee registration",
  "Choisissez la periode, votre niveau et un mentor disponible.": "Choose the period, your level, and an available mentor.",
  Nom: "Last name",
  Prenom: "First name",
  Email: "Email",
  Telephone: "Phone",
  "Langue preferee": "Preferred language",
  Francais: "French",
  Anglais: "English",
  Region: "Region",
  "Niveau academique": "Academic level",
  "Choisir un niveau": "Choose a level",
  "Choisir une periode": "Choose a period",
  "Capacite de mentorat": "Mentoring capacity",
  Objectifs: "Goals",
  "Mini bio": "Short bio",
  "Je consens au traitement de mes informations pour le programme Mentorat.":
    "I consent to the processing of my information for the Mentorship program.",
  "Envoi...": "Sending...",
  "Soumettre l'inscription mentor": "Submit mentor registration",
  "Soumettre l'inscription mentore": "Submit mentee registration",
  "Votre inscription mentor a ete envoyee et sera validee par l'administration.":
    "Your mentor registration has been sent and will be validated by the administration.",
  "Votre inscription mentore a ete envoyee et sera validee par l'administration.":
    "Your mentee registration has been sent and will be validated by the administration.",
  "Donnees d'inscription indisponibles:": "Registration data unavailable:",
  "Choisir un mentor disponible": "Choose an available mentor",
  "Aucun mentor disponible pour ce niveau actuellement.": "No mentor is currently available for this level.",
  "Mentors indisponibles:": "Mentors unavailable:",
  "Un cadre de mentorat academique simple a administrer": "An academic mentorship framework that is simple to manage",
  "Mentorat connecte les etudiants selon une progression academique claire, avec validation administrative et suivi des capacites.":
    "Mentorship connects students through a clear academic progression, with administrative validation and capacity tracking.",
  Accompagnement: "Support",
  "Chaque mentore avance avec un mentor du niveau academique superieur direct.": "Each mentee progresses with a mentor from the directly higher academic level.",
  Equite: "Equity",
  "Les capacites de mentorat sont controlees pour proteger la qualite de l'accompagnement.":
    "Mentoring capacities are controlled to protect the quality of support.",
  Gouvernance: "Governance",
  "Les inscriptions et jumelages restent valides par l'administration.": "Registrations and matches remain validated by the administration.",
  "La plateforme rend visibles les partenaires et les actions du programme.": "The platform highlights partners and program activities.",
  "Un parcours construit autour des niveaux academiques": "A journey built around academic levels",
  "La regle centrale est volontairement stricte: un mentore choisit uniquement un mentor du niveau superieur direct.":
    "The core rule is intentionally strict: a mentee can only choose a mentor from the directly higher level.",
  "Contacter l'equipe Mentorat": "Contact the Mentorship team",
  "Cette page est un point d'entree simple pour les demandes liees au programme.":
    "This page is a simple entry point for program-related requests.",
  "Evenements du programme": "Program events",
  "Cette page publique est prete a recevoir les ateliers, conferences et activites de reseautage exposes par l'API.":
    "This public page is ready to display workshops, conferences, and networking activities exposed by the API.",
  "Aucun evenement planifie": "No scheduled event",
  "Les evenements seront listes ici lorsque l'administration les publiera avec le statut PLANIFIE.":
    "Events will be listed here once the administration publishes them with the SCHEDULED status.",
  Video: "Video",
  "Lieu a confirmer": "Location to be confirmed",
  "Aucune description pour le moment.": "No description yet.",
  "Partenaires actifs": "Active partners",
  "Seuls les partenaires actifs sont affiches sur le site public.": "Only active partners are displayed on the public site.",
  "Aucun partenaire actif": "No active partner",
  "Aucun partenaire actif a afficher pour le moment.": "There are no active partners to display right now.",
  "Site web": "Website",
  "Devenir mentor": "Become a mentor",
  "Indiquez votre niveau academique et les informations utiles a votre profil mentor.":
    "Specify your academic level and the information useful for your mentor profile.",
  "Choisir un mentor admissible": "Choose an eligible mentor",
  "Apres le choix du niveau academique, la liste affiche uniquement les mentors actifs du niveau superieur direct avec une capacite disponible.":
    "After selecting the academic level, the list shows only active mentors from the directly higher level with available capacity.",
  "Utilisez votre email et votre mot de passe. Le systeme ouvrira automatiquement l'espace admin ou mentor.":
    "Use your email and password. The system will automatically open the admin or mentor space.",
  "Mot de passe": "Password",
  "Connexion...": "Signing in...",
  Dashboard: "Dashboard",
  "Vue d'ensemble du programme BMC Mentorat.": "Overview of the BMC Mentorship program.",
  Administration: "Administration",
  "Gestion des inscriptions, jumelages, evenements, partenaires et parametres.":
    "Manage registrations, matches, events, partners, and settings.",
  Mentors: "Mentors",
  Mentores: "Mentees",
  Jumelages: "Matches",
  Affectations: "Assignments",
  Suivis: "Follow-ups",
  Emails: "Emails",
  Administrateurs: "Administrators",
  Parametres: "Settings",
  "Periode de mentorat": "Mentorship period",
  Deconnexion: "Log out",
  "Gestion mentors": "Mentor management",
  "Liste lisible des mentors et des profils mentor et mentore.": "Readable list of mentors and mentor/mentee profiles.",
  "Aucun mentor a afficher pour le moment.": "No mentor to display at the moment.",
  "Creer un mentor": "Create a mentor",
  "Gestion mentores": "Mentee management",
  "Liste lisible des mentores et des profils mentor et mentore.": "Readable list of mentees and mentor/mentee profiles.",
  "Aucun mentore a afficher pour le moment.": "No mentee to display at the moment.",
  "Creer un mentore": "Create a mentee",
  "Administrateurs operationnels": "Operational administrators",
  "Cette section doit etre utilisee par ADMIN_PRINCIPAL; le backend bloque la creation d'administrateurs par ADMIN_OPERATIONNEL.":
    "This section must be used by ADMIN_PRINCIPAL; the backend prevents ADMIN_OPERATIONNEL from creating administrators.",
  "Gestion emails": "Email management",
  "Suivi des emails automatiques.": "Tracking automatic emails.",
  "Mes mentores": "My mentees",
  "Dossiers, seances et progression par mentore.": "Files, sessions, and progress for each mentee.",
  "Mes seances": "My sessions",
  "Rencontres programmees, realisees et a mettre a jour.": "Scheduled, completed, and pending sessions.",
  "Mettez a jour les seances realisees, l'appreciation et l'avancement des mentores.":
    "Update completed sessions, assessments, and mentee progress.",
  "Espace mentor": "Mentor space",
  "Tableau de bord": "Dashboard",
  "Affectations, seances et suivis actifs.": "Assignments, sessions, and active follow-ups.",
  "Compte et session de mentorat.": "Account and mentorship session.",
  "Reservations automatiques desactivees": "Automatic bookings disabled",
  "Les rencontres sont maintenant programmees par le mentor dans le cadre de la periode active.":
    "Meetings are now scheduled by the mentor within the active period.",
  "Votre mentor vous communiquera les dates des seances. Les commentaires et suivis sont geres par le mentor et visibles par l'administration.":
    "Your mentor will share session dates with you. Comments and follow-ups are managed by the mentor and visible to the administration.",
  "Compte mentor": "Mentor account",
  "Donnees de compte disponibles pour votre espace mentor.": "Account details available for your mentor space.",
  Modifier: "Edit",
  "Nom complet": "Full name",
  "Email de connexion": "Login email",
  Profil: "Profile",
  "Statut du compte": "Account status",
  "Non renseigne": "Not provided",
  "Session de mentorat": "Mentorship session",
  "Consultez la session actuelle et choisissez une nouvelle session uniquement lorsque la session en cours est expiree.":
    "Review the current session and choose a new one only when the current session has expired.",
  "Aucune session de mentorat n'est associee a votre compte pour le moment.": "No mentorship session is currently linked to your account.",
  "Session a choisir": "Session to choose",
  "Choisir une session": "Choose a session",
  Continuer: "Continue",
  "La session en cours n'est pas encore expiree.": "The current session has not expired yet.",
  "Aucune nouvelle session disponible.": "No new session available.",
  "Nouvelle session enregistree.": "New session recorded.",
  "Selectionnez une session.": "Select a session.",
  "Session introuvable.": "Session not found.",
  "Aucune session expiree ne peut etre reconduite.": "No expired session can be continued.",
  "Informations personnelles mises a jour.": "Personal information updated.",
  "Modifier les informations personnelles": "Edit personal information",
  "Mettez a jour les donnees principales de votre compte mentor.": "Update the main details of your mentor account.",
  Enregistrer: "Save",
  "Enregistrement...": "Saving...",
  "Retour en haut": "Back to top",
  "Basculer la langue": "Switch language",
  "Une plateforme de mentorat academique inspiree par l'excellence, le soutien et la communaute.":
    "An academic mentorship platform inspired by excellence, support, and community.",
  "Progression mentorat": "Mentorship progress",
  "Jumelages actifs": "Active matches",
  "Mentors satures": "Saturated mentors",
  "Priorites rapides": "Quick priorities",
  "Mentors disponibles": "Available mentors",
  "En attente": "Pending",
  "Profils mentors et mentor+mentore actifs.": "Active mentor and mentor+mentee profiles.",
  "Profils mentores suivis dans la plateforme.": "Mentee profiles tracked in the platform.",
  "Inscriptions a valider ou refuser.": "Registrations to approve or reject.",
  "Mentorats actuellement actifs.": "Mentorships currently active.",
  "Mentors avec une capacite restante.": "Mentors with remaining capacity.",
  "Mentors ayant atteint leur capacite.": "Mentors who have reached capacity.",
  "Evenements a venir": "Upcoming events",
  "Evenements planifies dans le programme.": "Events scheduled in the program.",
  "Partenaires visibles sur le site public.": "Partners visible on the public site.",
  "Aucune donnee pour le moment.": "No data at the moment.",
};

const exactFrenchToEnglish = new Map(
  Object.entries(englishDictionary).map(([french, english]) => [normalizeKey(french), english]),
);

const exactEnglishToFrench = new Map(
  Object.entries(englishDictionary).map(([french, english]) => [normalizeKey(english), french]),
);

type TranslationPattern = {
  from: RegExp;
  to: string | ((...args: string[]) => string);
};

const frenchToEnglishPatterns: TranslationPattern[] = [
  { from: /^(.+) a (\d{2}:\d{2})$/, to: (_, date, time) => `${date} at ${time}` },
  { from: /^Image de (.+)$/, to: (_, name) => `Image of ${name}` },
  { from: /^Logo de (.+)$/, to: (_, name) => `Logo of ${name}` },
  { from: /^Mentor: (.+)$/, to: (_, value) => `Mentor: ${value}` },
  { from: /^Avis: (.+)$/, to: (_, value) => `Opinion: ${value}` },
  { from: /^(\d+) element$/, to: (_, count) => `${count} item` },
  { from: /^(\d+) elements$/, to: (_, count) => `${count} items` },
  { from: /^(\d+) inscription\(s\) attendent une decision administrative\.$/, to: (_, count) => `${count} registration(s) are awaiting an administrative decision.` },
  { from: /^(\d+) mentor\(s\) peuvent encore accepter des mentores\.$/, to: (_, count) => `${count} mentor(s) can still accept mentees.` },
  { from: /^(\d+) evenement\(s\) planifie\(s\) sont visibles ou a venir\.$/, to: (_, count) => `${count} scheduled event(s) are visible or upcoming.` },
  { from: /\((\d+) place\)$/, to: (_, count) => `(${count} slot)` },
  { from: /\((\d+) places\)$/, to: (_, count) => `(${count} slots)` },
];

const englishToFrenchPatterns: TranslationPattern[] = [
  { from: /^(.+) at (\d{2}:\d{2})$/, to: (_, date, time) => `${date} a ${time}` },
  { from: /^Image of (.+)$/, to: (_, name) => `Image de ${name}` },
  { from: /^Logo of (.+)$/, to: (_, name) => `Logo de ${name}` },
  { from: /^Opinion: (.+)$/, to: (_, value) => `Avis: ${value}` },
  { from: /^(\d+) item$/, to: (_, count) => `${count} element` },
  { from: /^(\d+) items$/, to: (_, count) => `${count} elements` },
  { from: /^(\d+) registration\(s\) are awaiting an administrative decision\.$/, to: (_, count) => `${count} inscription(s) attendent une decision administrative.` },
  { from: /^(\d+) mentor\(s\) can still accept mentees\.$/, to: (_, count) => `${count} mentor(s) peuvent encore accepter des mentores.` },
  { from: /^(\d+) scheduled event\(s\) are visible or upcoming\.$/, to: (_, count) => `${count} evenement(s) planifie(s) sont visibles ou a venir.` },
  { from: /\((\d+) slot\)$/, to: (_, count) => `(${count} place)` },
  { from: /\((\d+) slots\)$/, to: (_, count) => `(${count} places)` },
];

function normalizeKey(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function translateWithPatterns(value: string, patterns: TranslationPattern[]) {
  for (const pattern of patterns) {
    if (pattern.from.test(value)) {
      return value.replace(pattern.from, pattern.to as never);
    }
  }
  return value;
}

function preserveWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

export function translateText(value: string, language: Language) {
  const normalizedValue = normalizeKey(value);
  if (!normalizedValue) {
    return value;
  }

  const exactMatch =
    language === "en"
      ? exactFrenchToEnglish.get(normalizedValue)
      : exactEnglishToFrench.get(normalizeKey(value));

  if (exactMatch) {
    return preserveWhitespace(value, exactMatch);
  }

  const translated =
    language === "en"
      ? translateWithPatterns(normalizedValue, frenchToEnglishPatterns)
      : translateWithPatterns(normalizedValue, englishToFrenchPatterns);

  return preserveWhitespace(value, translated);
}

function shouldSkipElement(element: Element | null) {
  return Boolean(
    !element ||
      element.closest("[data-no-translate]") ||
      ["SCRIPT", "STYLE", "NOSCRIPT"].includes(element.tagName),
  );
}

function translateTextNodes(root: ParentNode, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  while (currentNode) {
    const parentElement = currentNode.parentElement;
    if (parentElement && !shouldSkipElement(parentElement)) {
      const translated = translateText(currentNode.textContent ?? "", language);
      if (translated !== currentNode.textContent) {
        currentNode.textContent = translated;
      }
    }
    currentNode = walker.nextNode();
  }
}

function translateAttributes(root: ParentNode, language: Language) {
  const elements =
    root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from(document.body.querySelectorAll("*"));
  for (const element of elements) {
    if (shouldSkipElement(element)) {
      continue;
    }
    for (const attribute of ["aria-label", "title", "placeholder", "alt"]) {
      const value = element.getAttribute(attribute);
      if (!value) {
        continue;
      }
      const translated = translateText(value, language);
      if (translated !== value) {
        element.setAttribute(attribute, translated);
      }
    }
  }
}

export function translateDocument(language: Language) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.lang = language;
  document.documentElement.dataset.language = language;
  translateTextNodes(document.body, language);
  translateAttributes(document.body, language);
  document.title = translateText(document.title, language);
}
