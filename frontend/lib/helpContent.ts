import type { Language } from "@/lib/i18n";

export type HelpRole = "ADMIN_PRINCIPAL" | "ADMIN_OPERATIONNEL" | "MENTOR";
export type HelpScope = "admin" | "mentor";

export type HelpModuleKey =
  | "dashboard"
  | "registrations"
  | "matching"
  | "periods"
  | "sessions"
  | "admin_followups"
  | "mentors"
  | "mentees"
  | "teams"
  | "operational_admins"
  | "settings"
  | "exports_imports"
  | "alerts"
  | "authentication"
  | "about_page"
  | "teams_public"
  | "events"
  | "partners"
  | "mentor_dashboard"
  | "mentor_mentees"
  | "mentor_mentee_file"
  | "mentor_sessions"
  | "mentor_followups"
  | "mentor_public_profile"
  | "mentor_settings";

export type HelpModule = {
  key: HelpModuleKey;
  title: string;
  scope: "admin" | "mentor" | "shared";
  roles: HelpRole[];
  objective: string;
  whoCanUse: string;
  actions: string[];
  steps: string[];
  rules: string[];
  attention: string[];
  principalOnly?: string[];
  operationalNote?: string;
};

type HelpModuleContent = Omit<HelpModule, "key" | "scope" | "roles">;

export const helpUiText: Record<
  Language,
  {
    documentationKicker: string;
    pageTitle: string;
    guideDescription: (roleLabel: string) => string;
    modulesDocumented: string;
    noDashboardForMentees: string;
    objective: string;
    whoCanUse: string;
    actions: string;
    steps: string;
    rules: string;
    attention: string;
    principalOnlyForOperational: string;
    principalOnlyForAdmin: string;
    scopeAdmin: string;
    scopeMentor: string;
    scopeShared: string;
    rolePrincipal: string;
    roleOperational: string;
    roleMentor: string;
    rolePrincipalLong: string;
    roleOperationalLong: string;
    roleMentorLong: string;
    helpAria: (title: string) => string;
    modalDescription: string;
    close: string;
    viewAllDocumentation: string;
  }
> = {
  fr: {
    documentationKicker: "Documentation interne",
    pageTitle: "Aide",
    guideDescription: (roleLabel) => `Guide d’utilisation de la plateforme, adapté à votre espace ${roleLabel}.`,
    modulesDocumented: "modules documentés",
    noDashboardForMentees:
      "Les mentorés n’ont pas de tableau de bord. Cette aide concerne uniquement les administrateurs et les mentors connectés.",
    objective: "Objectif",
    whoCanUse: "Qui peut l'utiliser",
    actions: "Actions possibles",
    steps: "Étapes d’utilisation",
    rules: "Règles importantes",
    attention: "Points d’attention",
    principalOnlyForOperational: "Actions réservées au principal",
    principalOnlyForAdmin: "Actions réservées admin principal",
    scopeAdmin: "Admin",
    scopeMentor: "Mentor",
    scopeShared: "Commun",
    rolePrincipal: "Admin principal",
    roleOperational: "Admin opérationnel",
    roleMentor: "Mentor",
    rolePrincipalLong: "administrateur principal",
    roleOperationalLong: "administrateur opérationnel",
    roleMentorLong: "mentor",
    helpAria: (title) => `Aide - ${title}`,
    modalDescription: "Aide contextuelle du module courant.",
    close: "Fermer",
    viewAllDocumentation: "Voir toute la documentation",
  },
  en: {
    documentationKicker: "Internal documentation",
    pageTitle: "Help",
    guideDescription: (roleLabel) => `Platform usage guide adapted to your ${roleLabel} workspace.`,
    modulesDocumented: "documented modules",
    noDashboardForMentees:
      "Mentees do not have a dashboard. This help section is only for signed-in administrators and mentors.",
    objective: "Objective",
    whoCanUse: "Who can use it",
    actions: "Available actions",
    steps: "How to use it",
    rules: "Important rules",
    attention: "Points to watch",
    principalOnlyForOperational: "Principal admin only",
    principalOnlyForAdmin: "Principal administrator actions",
    scopeAdmin: "Admin",
    scopeMentor: "Mentor",
    scopeShared: "Shared",
    rolePrincipal: "Principal admin",
    roleOperational: "Operational admin",
    roleMentor: "Mentor",
    rolePrincipalLong: "principal administrator",
    roleOperationalLong: "operational administrator",
    roleMentorLong: "mentor",
    helpAria: (title) => `Help - ${title}`,
    modalDescription: "Contextual help for the current module.",
    close: "Close",
    viewAllDocumentation: "View full documentation",
  },
};

export const helpModules: HelpModule[] = [
  {
    key: "dashboard",
    title: "Tableau de bord admin",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Donner une vue rapide de l'activité de la plateforme.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Consulter les statistiques globales.",
      "Repérer les inscriptions en attente.",
      "Suivre les jumelages actifs, mentors disponibles et événements à venir.",
    ],
    steps: [
      "Ouvrir Tableau de bord dans le menu admin.",
      "Lire les cartes statistiques.",
      "Traiter les priorités indiquées dans les alertes ou les cartes.",
    ],
    rules: [
      "Les données dépendent des inscriptions, affectations, événements et partenaires actifs.",
      "Les chiffres doivent toujours être vérifiés dans les modules métiers avant une décision sensible.",
    ],
    attention: [
      "Un chiffre à zéro peut signifier qu’aucune donnée n’existe ou que les statuts ne sont pas encore validés.",
    ],
  },
  {
    key: "registrations",
    title: "Inscriptions",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Centraliser les demandes d’inscription mentors et mentorés.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Rechercher une inscription.",
      "Filtrer par rôle ou statut.",
      "Ouvrir le détail d’un dossier.",
      "Valider ou refuser une inscription en attente.",
    ],
    steps: [
      "Ouvrir Inscriptions.",
      "Utiliser la recherche ou les filtres si la liste est longue.",
      "Cliquer sur Détail pour vérifier le niveau, le statut et la session.",
      "Valider uniquement les dossiers complets.",
    ],
    rules: [
      "La validation peut déclencher la suite du flux de jumelage.",
      "Un mentoré peut demander que l’association choisisse le mentor.",
      "Les niveaux académiques doivent rester compatibles avec le profil mentorat.",
    ],
    attention: [
      "Vérifier le niveau académique avant validation.",
      "Une inscription validée ne doit pas être traitée comme une simple demande en attente.",
    ],
  },
  {
    key: "matching",
    title: "Jumelage",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Associer ou réassocier un mentoré à un mentor compatible.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Consulter tous les mentorés pertinents.",
      "Voir le détail du dossier.",
      "Réassigner un mentor.",
      "Filtrer par session si plusieurs sessions existent.",
    ],
    steps: [
      "Ouvrir Jumelages.",
      "Identifier un mentoré non assigné ou à réassocier.",
      "Cliquer sur Détails pour comprendre le contexte.",
      "Cliquer sur Réassignation.",
      "Choisir un mentor compatible et confirmer.",
    ],
    rules: [
      "Le mentor doit être du niveau supérieur direct.",
      "Le mentor ne doit pas dépasser sa capacité.",
      "Un mentoré ne doit pas avoir deux affectations actives dans la même période.",
    ],
    attention: [
      "Si aucun mentor n’apparaît, vérifier le niveau du mentoré et la capacité des mentors.",
      "Les anciennes affectations doivent être archivées ou fermées par la logique backend.",
    ],
  },
  {
    key: "periods",
    title: "Périodes de mentorat",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Structurer les affectations, séances et suivis par session.",
    whoCanUse: "Les deux administrateurs peuvent consulter. Seul l’administrateur principal peut créer ou modifier.",
    actions: [
      "Consulter les périodes existantes.",
      "Voir le détail d’une période.",
    ],
    principalOnly: [
      "Créer une nouvelle période.",
      "Définir le nombre maximal de mentorés par mentor dans la période.",
      "Modifier les dates, le statut ou le nombre de séances.",
      "Exporter les données Excel ou CSV d’une période.",
      "Activer, terminer, archiver ou supprimer une période.",
    ],
    operationalNote:
      "Vous pouvez consulter les périodes, mais la création, la modification, la limite de mentorés et les exports sont réservés au principal.",
    steps: [
      "Ouvrir Paramètres puis Période de mentorat, ou le module dédié.",
      "Vérifier le statut de la période.",
      "L’administrateur principal vérifie ou définit la limite de mentorés par mentor.",
      "L’administrateur principal exporte les données en fin de session.",
      "Archiver uniquement après vérification administrative et export si nécessaire.",
    ],
    rules: [
      "Une affectation appartient à une période.",
      "La limite maximale de mentorés par mentor dépend de la période active.",
      "La fin de période doit déclencher une vérification des exports.",
      "Les mentors ne choisissent pas eux-mêmes les périodes système.",
    ],
    attention: [
      "Une période terminée doit être exportée pour conservation.",
      "Ne pas créer deux périodes actives concurrentes sans raison claire.",
    ],
  },
  {
    key: "sessions",
    title: "Séances admin",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Suivre les rencontres programmées et réalisées dans le programme.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Consulter les séances.",
      "Vérifier les statuts.",
      "Contrôler la progression des sessions.",
    ],
    steps: [
      "Ouvrir le module Séances ou rapports de mentorat.",
      "Filtrer si des options sont disponibles.",
      "Consulter les détails avant toute correction.",
    ],
    rules: [
      "Les mentors programment leurs séances depuis leur espace.",
      "Les statuts doivent rester cohérents avec le suivi.",
      "Les administrateurs opérationnels ne créent pas les sessions/périodes de mentorat.",
    ],
    attention: [
      "Une séance non réalisée ne doit pas compter dans l’avancement.",
      "Les changements administratifs doivent rester traçables.",
    ],
  },
  {
    key: "admin_followups",
    title: "Suivis admin",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Vérifier l’avancement des mentorés et la qualité des suivis.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Consulter la progression.",
      "Identifier les dossiers sensibles.",
      "Lire les observations et recommandations.",
    ],
    steps: [
      "Ouvrir Suivis.",
      "Repérer les avancements faibles ou statuts sensibles.",
      "Consulter le détail avant de contacter un mentor.",
    ],
    rules: [
      "L’avancement est calculé à partir des séances réalisées.",
      "Les appréciations doivent rester professionnelles et utiles.",
    ],
    attention: [
      "Les observations peuvent contenir des informations sensibles : limiter leur diffusion.",
    ],
  },
  {
    key: "mentors",
    title: "Mentors",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Gérer les comptes mentors et les profils mentor + mentoré.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Créer un mentor.",
      "Modifier ses informations autorisées.",
      "Changer son statut de compte.",
      "Voir le détail du profil.",
    ],
    steps: [
      "Ouvrir Mentors.",
      "Cliquer sur Créer un mentor ou Modifier.",
      "Choisir un niveau compatible.",
      "Enregistrer et vérifier le détail.",
    ],
    rules: [
      "Le secondaire ne peut pas être mentor.",
      "La médecine est mentor uniquement.",
      "Les niveaux intermédiaires peuvent être mentor et mentoré.",
    ],
    attention: [
      "Ne pas créer un second compte si la personne existe déjà.",
      "Le niveau académique ne doit pas diminuer.",
    ],
  },
  {
    key: "mentees",
    title: "Mentorés",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Gérer les comptes mentorés et les profils mixtes.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Créer un mentoré.",
      "Modifier un mentoré.",
      "Transformer un mentoré admissible en mentor ou mentor + mentoré.",
      "Voir le détail du profil.",
    ],
    steps: [
      "Ouvrir Mentorés.",
      "Choisir ou modifier le niveau académique.",
      "Sélectionner le profil mentorat autorisé par ce niveau.",
      "Enregistrer.",
    ],
    rules: [
      "Secondaire : mentoré uniquement.",
      "Niveaux intermédiaires : mentor, mentoré, ou mentor et mentoré.",
      "Médecine : mentor uniquement.",
    ],
    attention: [
      "Transformer un mentoré ne doit pas supprimer ses données de mentoré.",
      "Le backend refuse les profils incompatibles même si l’interface est contournée.",
    ],
  },
  {
    key: "teams",
    title: "Équipes",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Valider les mentors qui souhaitent apparaître publiquement.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Consulter les demandes d’apparition publique.",
      "Vérifier la photo, la mini bio, le domaine et le niveau.",
      "Approuver ou retirer l’affichage public.",
      "Définir un ordre d’affichage.",
    ],
    steps: [
      "Ouvrir Équipes.",
      "Lire le profil public proposé.",
      "Vérifier que les informations sont complètes et professionnelles.",
      "Approuver puis vérifier l’ordre d’affichage.",
    ],
    rules: [
      "Un mentor apparaît publiquement seulement après validation admin.",
      "Le profil doit contenir une photo, une mini bio, un domaine et un consentement.",
    ],
    attention: [
      "Refuser ou masquer un profil incomplet plutôt que publier une information fragile.",
    ],
  },
  {
    key: "operational_admins",
    title: "Administrateurs opérationnels",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL"],
    objective: "Gérer les comptes administrateurs opérationnels et valider leur affichage public.",
    whoCanUse: "Administrateur principal uniquement.",
    actions: [
      "Créer un administrateur opérationnel.",
      "Modifier ou désactiver un compte.",
      "Valider ou refuser les informations publiques de la page À propos.",
      "Comparer les anciennes et nouvelles informations publiques.",
    ],
    steps: [
      "Ouvrir Administrateurs.",
      "Traiter les validations publiques en attente.",
      "Approuver uniquement les profils complets.",
      "Créer ou modifier un compte si nécessaire.",
    ],
    rules: [
      "Un administrateur opérationnel ne peut pas créer un autre administrateur.",
      "Toute modification publique doit repasser en validation.",
    ],
    attention: [
      "Ne jamais partager un compte admin entre plusieurs personnes.",
      "Vérifier la photo et la description avant publication.",
    ],
  },
  {
    key: "settings",
    title: "Paramètres",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Gérer les réglages autorisés du compte ou du système.",
    whoCanUse: "Administrateur principal et administrateur opérationnel, avec droits différents.",
    actions: [
      "Mettre à jour son compte personnel.",
      "Consulter certains paramètres utiles.",
    ],
    principalOnly: [
      "Modifier les paramètres globaux sensibles.",
      "Créer et modifier les périodes de mentorat.",
      "Définir le nombre maximal de mentorés par mentor dans une période.",
      "Gérer les périodes de mentorat.",
    ],
    operationalNote: "Votre page Paramètres doit rester centrée sur vos informations personnelles.",
    steps: [
      "Ouvrir Paramètres.",
      "Choisir Mon compte ou la section disponible.",
      "Modifier uniquement les informations autorisées.",
      "Enregistrer puis vérifier le message de confirmation.",
    ],
    rules: [
      "Les rôles et permissions ne se modifient pas depuis Mon compte.",
      "Les paramètres globaux sont réservés au principal.",
    ],
    attention: [
      "Un changement public d’admin opérationnel repasse en validation principale.",
    ],
  },
  {
    key: "exports_imports",
    title: "Exports / Imports",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Sauvegarder, archiver ou analyser les données administratives.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Consulter les rapports administratifs disponibles.",
      "Préparer les données utiles aux bilans de fin de session.",
    ],
    principalOnly: [
      "Exporter une période en Excel.",
      "Exporter une période en CSV.",
      "Lancer un export à tout moment, pendant ou après une période.",
    ],
    operationalNote:
      "Vous pouvez consulter plusieurs modules et rapports, mais vous ne pouvez pas exporter les données.",
    steps: [
      "Ouvrir Périodes de mentorat.",
      "L’administrateur principal clique sur Export Excel ou Export CSV.",
      "Conserver le fichier dans l’espace administratif prévu.",
      "Vérifier les feuilles et statistiques produites.",
    ],
    rules: [
      "Seul l’administrateur principal peut exporter les données.",
      "L’administrateur opérationnel reçoit une erreur 403 s’il tente d’exporter.",
      "L’export est prioritairement prévu en fin de session.",
      "L’export peut être fait en tout temps par l’administrateur principal.",
      "Les données manquantes doivent être lues comme Non renseigné ou Aucun suivi.",
    ],
    attention: [
      "L’export de fin de session est prioritaire pour l’archivage.",
      "Ne pas transmettre les exports à des personnes non autorisées.",
    ],
  },
  {
    key: "alerts",
    title: "Alertes / notifications",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Signaler les actions administratives qui attendent une décision.",
    whoCanUse: "Administrateur principal et administrateur opérationnel selon les alertes.",
    actions: [
      "Voir les badges du sidebar.",
      "Traiter les inscriptions en attente.",
      "Traiter les jumelages en attente.",
    ],
    principalOnly: [
      "Traiter les administrateurs opérationnels en attente de validation publique.",
      "Traiter les alertes de fin ou création de session.",
    ],
    steps: [
      "Repérer le badge dans le sidebar.",
      "Ouvrir le module correspondant.",
      "Traiter les éléments en attente.",
      "Recharger ou vérifier que le badge baisse.",
    ],
    rules: [
      "Un badge représente une action en attente, pas seulement une information.",
      "Les alertes réservées au principal ne doivent pas apparaître comme action opérationnelle.",
    ],
    attention: [
      "Si un badge reste affiché, vérifier les statuts des données concernées.",
    ],
  },
  {
    key: "events",
    title: "Événements",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Gérer les événements visibles ou planifiés pour le programme.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Créer un événement.",
      "Ajouter une image ou une vidéo.",
      "Modifier, afficher les détails ou supprimer.",
      "Planifier la publication via le statut.",
    ],
    steps: [
      "Ouvrir Événements.",
      "Créer ou modifier l’événement.",
      "Ajouter les médias si disponibles.",
      "Utiliser le statut planifié pour l’affichage public.",
    ],
    rules: [
      "Les événements publics doivent être planifiés.",
      "Les images et vidéos doivent rester lisibles et adaptées au site.",
    ],
    attention: [
      "Vérifier le rendu public après ajout d’un média.",
    ],
  },
  {
    key: "partners",
    title: "Partenaires",
    scope: "admin",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Gérer les partenaires affichés sur le site public.",
    whoCanUse: "Administrateur principal et administrateur opérationnel.",
    actions: [
      "Créer un partenaire.",
      "Ajouter son logo et son site web.",
      "Activer, désactiver, modifier ou supprimer.",
    ],
    steps: [
      "Ouvrir Partenaires.",
      "Renseigner les informations principales.",
      "Définir l’ordre d’affichage.",
      "Activer uniquement les partenaires prêts à être publics.",
    ],
    rules: [
      "Seuls les partenaires actifs sont affichés publiquement.",
      "Les logos doivent être propres et lisibles.",
    ],
    attention: [
      "Vérifier les liens externes avant publication.",
    ],
  },
  {
    key: "about_page",
    title: "Page À propos",
    scope: "shared",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL"],
    objective: "Présenter l’organisation, les administrateurs visibles et l’identité du programme.",
    whoCanUse: "Les administrateurs gèrent les contenus de profil qui y apparaissent.",
    actions: [
      "Vérifier les administrateurs opérationnels publiés.",
      "Valider les modifications publiques.",
      "Contrôler la cohérence des photos, titres et descriptions.",
    ],
    steps: [
      "Ouvrir Administrateurs.",
      "Vérifier les profils en attente.",
      "Approuver les informations publiques correctes.",
      "Consulter la page À propos côté public.",
    ],
    rules: [
      "Un profil admin opérationnel modifié repasse en attente de validation.",
      "Les données publiques ne changent pas sans validation principale.",
    ],
    attention: [
      "Ne pas publier une description incomplète ou non professionnelle.",
    ],
  },
  {
    key: "teams_public",
    title: "Page Équipes",
    scope: "shared",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL", "MENTOR"],
    objective: "Afficher publiquement les mentors approuvés.",
    whoCanUse: "Les mentors soumettent leur profil. Les admins valident.",
    actions: [
      "Mentor : compléter le profil Équipes.",
      "Admin : vérifier et valider les demandes.",
      "Public : consulter les profils approuvés.",
    ],
    steps: [
      "Le mentor complète la photo, le domaine, la mini bio et le consentement.",
      "L’admin ouvre Équipes.",
      "L’admin approuve et ordonne l’affichage.",
    ],
    rules: [
      "Sans validation admin, le profil mentor ne doit pas apparaître publiquement.",
      "La mini bio remplace le champ Objectif.",
    ],
    attention: [
      "Un profil public doit rester court, clair et professionnel.",
    ],
  },
  {
    key: "authentication",
    title: "Authentification",
    scope: "shared",
    roles: ["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL", "MENTOR"],
    objective: "Sécuriser l’accès aux tableaux de bord.",
    whoCanUse: "Administrateurs et mentors. Les mentorés n’ont pas de tableau de bord.",
    actions: [
      "Connexion par adresse courriel et mot de passe.",
      "Vérification par code temporaire si la double authentification est active.",
      "Déconnexion depuis le sidebar.",
    ],
    steps: [
      "Saisir l’adresse courriel et le mot de passe.",
      "Entrer le code reçu par courriel si demandé.",
      "Accéder au tableau de bord correspondant au rôle.",
    ],
    rules: [
      "Le code temporaire expire après 15 minutes.",
      "Le code est à usage unique.",
      "En développement, la double authentification peut être désactivée par configuration.",
    ],
    attention: [
      "Un jeton invalide impose de se reconnecter.",
      "Ne jamais partager un mot de passe ou un code temporaire.",
    ],
  },
  {
    key: "mentor_dashboard",
    title: "Tableau de bord mentor",
    scope: "mentor",
    roles: ["MENTOR"],
    objective: "Afficher les priorités du mentor : mentorés, séances et progression.",
    whoCanUse: "Mentors connectés.",
    actions: [
      "Consulter les statistiques personnelles.",
      "Voir les dernières séances.",
      "Identifier les mentorés à suivre.",
    ],
    steps: [
      "Ouvrir Tableau de bord.",
      "Lire les cartes de synthèse.",
      "Cliquer vers les dossiers ou séances à traiter.",
    ],
    rules: [
      "Un mentor voit uniquement ses propres affectations.",
      "Les données proviennent des séances et suivis associés.",
    ],
    attention: [
      "Si aucune donnée n’apparaît, vérifier qu’une affectation active existe.",
    ],
  },
  {
    key: "mentor_mentees",
    title: "Mentorés du mentor",
    scope: "mentor",
    roles: ["MENTOR"],
    objective: "Consulter les mentorés assignés au mentor.",
    whoCanUse: "Mentors connectés.",
    actions: [
      "Voir la liste des mentorés.",
      "Consulter la progression.",
      "Ouvrir un dossier mentoré.",
    ],
    steps: [
      "Ouvrir Mentorés.",
      "Identifier le dossier à consulter.",
      "Cliquer sur Voir le dossier.",
    ],
    rules: [
      "Seuls les mentorés affectés au mentor connecté sont visibles.",
      "La progression dépend des séances réalisées.",
    ],
    attention: [
      "Un mentoré absent de la liste peut ne pas être affecté dans la session active.",
    ],
  },
  {
    key: "mentor_mentee_file",
    title: "Dossier mentoré",
    scope: "mentor",
    roles: ["MENTOR"],
    objective: "Centraliser les séances, commentaires et avancement d’un mentoré.",
    whoCanUse: "Mentor responsable du mentoré.",
    actions: [
      "Voir le résumé du dossier.",
      "Programmer une séance.",
      "Consulter les suivis de séance.",
    ],
    steps: [
      "Ouvrir Mentorés.",
      "Cliquer sur Voir le dossier.",
      "Vérifier la progression et les séances.",
      "Créer une séance si nécessaire.",
    ],
    rules: [
      "Un mentor ne peut consulter que les dossiers qui lui appartiennent.",
      "Chaque séance doit rester rattachée à l’affectation active.",
    ],
    attention: [
      "Les commentaires doivent être utiles, respectueux et factuels.",
    ],
  },
  {
    key: "mentor_sessions",
    title: "Séances mentor",
    scope: "mentor",
    roles: ["MENTOR"],
    objective: "Programmer et mettre à jour les rencontres de mentorat.",
    whoCanUse: "Mentors connectés.",
    actions: [
      "Créer une séance.",
      "Modifier une séance.",
      "Voir les détails d’une séance.",
      "Changer le statut lorsque la rencontre est réalisée.",
    ],
    steps: [
      "Ouvrir Séances.",
      "Cliquer sur Créer une séance.",
      "Choisir le mentoré et renseigner date, heure et objet.",
      "Mettre à jour le statut après la rencontre.",
    ],
    rules: [
      "La date et le numéro de séance sont obligatoires.",
      "L’heure de début doit être avant l’heure de fin.",
      "Le numéro de séance ne doit pas dépasser le nombre prévu.",
    ],
    attention: [
      "Une séance non réalisée ne doit pas être marquée comme réalisée.",
    ],
  },
  {
    key: "mentor_followups",
    title: "Suivis mentor",
    scope: "mentor",
    roles: ["MENTOR"],
    objective: "Documenter l'appréciation, les observations et recommandations après les séances.",
    whoCanUse: "Mentors connectés.",
    actions: [
      "Voir les séances réalisées.",
      "Ouvrir le détail du suivi.",
      "Mettre à jour l'appréciation et les recommandations.",
    ],
    steps: [
      "Ouvrir Suivis.",
      "Choisir une séance réalisée.",
      "Cliquer sur Mise à jour.",
      "Enregistrer l'appréciation et les notes utiles.",
    ],
    rules: [
      "Le pourcentage d’avancement est calculé automatiquement.",
      "Les notes doivent rester professionnelles.",
    ],
    attention: [
      "Éviter les informations inutiles ou trop personnelles.",
    ],
  },
  {
    key: "mentor_public_profile",
    title: "Profil public mentor",
    scope: "mentor",
    roles: ["MENTOR"],
    objective: "Soumettre les informations visibles sur la page Équipes.",
    whoCanUse: "Mentors connectés.",
    actions: [
      "Ajouter une photo.",
      "Renseigner le domaine ou la spécialité.",
      "Écrire la mini bio.",
      "Accepter l’apparition publique.",
    ],
    steps: [
      "Ouvrir Paramètres.",
      "Choisir Profil Équipes.",
      "Compléter tous les champs obligatoires.",
      "Enregistrer et attendre la validation admin.",
    ],
    rules: [
      "La publication publique demande une validation admin.",
      "Photo, domaine, mini bio et consentement sont obligatoires.",
    ],
    attention: [
      "La photo et la mini bio doivent rester professionnelles.",
    ],
  },
  {
    key: "mentor_settings",
    title: "Paramètres mentor",
    scope: "mentor",
    roles: ["MENTOR"],
    objective: "Gérer les informations personnelles, le profil public et la session de mentorat.",
    whoCanUse: "Mentors connectés.",
    actions: [
      "Mettre à jour prénom et nom.",
      "Changer le mot de passe.",
      "Compléter le profil public Équipes.",
      "Choisir une nouvelle session seulement quand c’est autorisé.",
    ],
    steps: [
      "Ouvrir Paramètres.",
      "Choisir Compte, Profil Équipes ou Session de mentorat.",
      "Modifier uniquement les informations autorisées.",
      "Enregistrer et lire le message de confirmation.",
    ],
    rules: [
      "Le mentor ne modifie pas son rôle ni ses permissions.",
      "Le changement de session est limité aux cas prévus par l’administration.",
    ],
    attention: [
      "Si aucune nouvelle session n’est disponible, attendre la création admin.",
    ],
  },
];

const englishHelpContent: Record<HelpModuleKey, HelpModuleContent> = {
  dashboard: {
    title: "Admin dashboard",
    objective: "Provide a quick overview of platform activity.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Review global statistics.",
      "Spot pending registrations.",
      "Track active matches, available mentors, and upcoming events.",
    ],
    steps: [
      "Open Dashboard from the admin menu.",
      "Read the statistic cards.",
      "Handle the priorities shown in alerts or cards.",
    ],
    rules: [
      "The data depends on active registrations, assignments, events, and partners.",
      "Figures should always be checked in the business modules before any sensitive decision.",
    ],
    attention: [
      "A zero value can mean that no data exists or that statuses have not been validated yet.",
    ],
  },
  registrations: {
    title: "Registrations",
    objective: "Centralize mentor and mentee registration requests.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Search a registration.",
      "Filter by role or status.",
      "Open a file detail.",
      "Approve or reject a pending registration.",
    ],
    steps: [
      "Open Registrations.",
      "Use search or filters if the list is long.",
      "Click Details to review level, status, and session.",
      "Approve only complete files.",
    ],
    rules: [
      "Approval can trigger the next matching step.",
      "A mentee can ask the association to choose the mentor.",
      "Academic levels must stay compatible with the mentoring profile.",
    ],
    attention: [
      "Check the academic level before approval.",
      "An approved registration should not be handled as a simple pending request.",
    ],
  },
  matching: {
    title: "Matching",
    objective: "Assign or reassign a mentee to a compatible mentor.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Review all relevant mentees.",
      "Open the file details.",
      "Reassign a mentor.",
      "Filter by session when several sessions exist.",
    ],
    steps: [
      "Open Matching.",
      "Identify an unassigned mentee or one that needs reassignment.",
      "Click Details to understand the context.",
      "Click Reassignment.",
      "Choose a compatible mentor and confirm.",
    ],
    rules: [
      "The mentor must be from the directly higher level.",
      "The mentor must not exceed capacity.",
      "A mentee must not have two active assignments in the same period.",
    ],
    attention: [
      "If no mentor appears, check the mentee level and mentor capacity.",
      "Old assignments must be archived or closed by backend logic.",
    ],
  },
  periods: {
    title: "Mentorship periods",
    objective: "Organize assignments, sessions, and follow-ups by program period.",
    whoCanUse: "Both administrators can view. Only the principal administrator can create or edit.",
    actions: [
      "Review existing periods.",
      "Open a period detail.",
    ],
    principalOnly: [
      "Create a new period.",
      "Set the maximum number of mentees per mentor in the period.",
      "Edit dates, status, or required session count.",
      "Export period data to Excel or CSV.",
      "Activate, complete, archive, or delete a period.",
    ],
    operationalNote:
      "You can view periods, but creation, editing, mentee limits, and exports are reserved for the principal administrator.",
    steps: [
      "Open Settings then Mentorship period, or the dedicated module.",
      "Check the period status.",
      "The principal administrator checks or sets the mentee limit per mentor.",
      "The principal administrator exports data at the end of the session.",
      "Archive only after administrative review and export when needed.",
    ],
    rules: [
      "An assignment belongs to a period.",
      "The maximum number of mentees per mentor depends on the active period.",
      "A period ending should trigger export verification.",
      "Mentors do not choose system periods by themselves.",
    ],
    attention: [
      "A completed period should be exported for records.",
      "Do not create two active periods at the same time without a clear reason.",
    ],
  },
  sessions: {
    title: "Admin sessions",
    objective: "Track scheduled and completed mentorship meetings.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Review sessions.",
      "Check statuses.",
      "Monitor session progress.",
    ],
    steps: [
      "Open Sessions or mentorship reports.",
      "Apply filters if available.",
      "Review details before any correction.",
    ],
    rules: [
      "Mentors schedule their own sessions from their workspace.",
      "Statuses must remain consistent with follow-up data.",
      "Operational administrators do not create mentorship sessions or periods.",
    ],
    attention: [
      "A session that was not completed must not count toward progress.",
      "Administrative changes should remain traceable.",
    ],
  },
  admin_followups: {
    title: "Admin follow-ups",
    objective: "Review mentee progress and the quality of follow-ups.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Review progress.",
      "Identify sensitive files.",
      "Read observations and recommendations.",
    ],
    steps: [
      "Open Follow-ups.",
      "Spot low progress or sensitive statuses.",
      "Review details before contacting a mentor.",
    ],
    rules: [
      "Progress is calculated from completed sessions.",
      "Assessments must remain professional and useful.",
    ],
    attention: [
      "Observations can contain sensitive information: limit distribution.",
    ],
  },
  mentors: {
    title: "Mentors",
    objective: "Manage mentor accounts and mentor plus mentee profiles.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Create a mentor.",
      "Edit authorized information.",
      "Change account status.",
      "Open profile details.",
    ],
    steps: [
      "Open Mentors.",
      "Click Create mentor or Edit.",
      "Choose a compatible level.",
      "Save and review the detail.",
    ],
    rules: [
      "Secondary level cannot be a mentor.",
      "Medicine is mentor only.",
      "Intermediate levels can be mentor and mentee.",
    ],
    attention: [
      "Do not create a second account if the person already exists.",
      "Academic level must not decrease.",
    ],
  },
  mentees: {
    title: "Mentees",
    objective: "Manage mentee accounts and mixed profiles.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Create a mentee.",
      "Edit a mentee.",
      "Turn an eligible mentee into mentor or mentor plus mentee.",
      "Open profile details.",
    ],
    steps: [
      "Open Mentees.",
      "Choose or edit the academic level.",
      "Select the mentoring profile allowed for that level.",
      "Save.",
    ],
    rules: [
      "Secondary: mentee only.",
      "Intermediate levels: mentor, mentee, or mentor and mentee.",
      "Medicine: mentor only.",
    ],
    attention: [
      "Turning a mentee into a mentor must not delete mentee data.",
      "The backend rejects incompatible profiles even if the interface is bypassed.",
    ],
  },
  teams: {
    title: "Teams",
    objective: "Approve mentors who want to appear publicly.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Review public visibility requests.",
      "Check photo, short bio, field, and level.",
      "Approve or remove public display.",
      "Set display order.",
    ],
    steps: [
      "Open Teams.",
      "Read the proposed public profile.",
      "Check that the information is complete and professional.",
      "Approve and verify display order.",
    ],
    rules: [
      "A mentor appears publicly only after admin approval.",
      "The profile must include a photo, short bio, field, and consent.",
    ],
    attention: [
      "Reject or hide an incomplete profile instead of publishing weak information.",
    ],
  },
  operational_admins: {
    title: "Operational administrators",
    objective: "Manage operational administrator accounts and approve their public display.",
    whoCanUse: "Principal administrator only.",
    actions: [
      "Create an operational administrator.",
      "Edit or deactivate an account.",
      "Approve or reject public information for the About page.",
      "Compare old and new public information.",
    ],
    steps: [
      "Open Administrators.",
      "Process pending public approvals.",
      "Approve only complete profiles.",
      "Create or edit an account if needed.",
    ],
    rules: [
      "An operational administrator cannot create another administrator.",
      "Any public profile change must go back to approval.",
    ],
    attention: [
      "Never share an admin account between several people.",
      "Check the photo and description before publication.",
    ],
  },
  settings: {
    title: "Settings",
    objective: "Manage authorized account or system settings.",
    whoCanUse: "Principal administrator and operational administrator, with different rights.",
    actions: [
      "Update your personal account.",
      "Review useful settings.",
    ],
    principalOnly: [
      "Edit sensitive global settings.",
      "Create and edit mentorship periods.",
      "Set the maximum number of mentees per mentor inside a period.",
      "Manage mentorship periods.",
    ],
    operationalNote: "Your Settings page should stay focused on your personal information.",
    steps: [
      "Open Settings.",
      "Choose My account or the available section.",
      "Edit only authorized information.",
      "Save and check the confirmation message.",
    ],
    rules: [
      "Roles and permissions are not edited from My account.",
      "Global settings are reserved for the principal administrator.",
    ],
    attention: [
      "A public change by an operational administrator goes back to principal approval.",
    ],
  },
  exports_imports: {
    title: "Exports / Imports",
    objective: "Save, archive, or analyze administrative data.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Review available administrative reports.",
      "Prepare useful data for end-of-session reports.",
    ],
    principalOnly: [
      "Export a period to Excel.",
      "Export a period to CSV.",
      "Run an export at any time, during or after a period.",
    ],
    operationalNote:
      "You can view several modules and reports, but you cannot export data.",
    steps: [
      "Open Mentorship periods.",
      "The principal administrator clicks Export Excel or Export CSV.",
      "Store the file in the planned administrative space.",
      "Check the generated sheets and statistics.",
    ],
    rules: [
      "Only the principal administrator can export data.",
      "The operational administrator receives a 403 error if they try to export.",
      "Export is primarily intended for the end of a session.",
      "The principal administrator can export at any time.",
      "Missing data should be read as Not provided or No follow-up.",
    ],
    attention: [
      "End-of-session export is the priority for archiving.",
      "Do not send exports to unauthorized people.",
    ],
  },
  alerts: {
    title: "Alerts / notifications",
    objective: "Highlight administrative actions waiting for a decision.",
    whoCanUse: "Principal administrator and operational administrator depending on the alert.",
    actions: [
      "See sidebar badges.",
      "Process pending registrations.",
      "Process pending matches.",
    ],
    principalOnly: [
      "Process operational administrators pending public approval.",
      "Process end-of-session or session creation alerts.",
    ],
    steps: [
      "Find the badge in the sidebar.",
      "Open the related module.",
      "Process pending items.",
      "Refresh or check that the badge decreases.",
    ],
    rules: [
      "A badge represents a pending action, not just information.",
      "Principal-only alerts must not appear as operational actions.",
    ],
    attention: [
      "If a badge remains visible, check the statuses of related data.",
    ],
  },
  authentication: {
    title: "Authentication",
    objective: "Secure access to dashboards.",
    whoCanUse: "Administrators and mentors. Mentees do not have a dashboard.",
    actions: [
      "Sign in with email and password.",
      "Verify with a temporary code if two-step login is active.",
      "Log out from the sidebar.",
    ],
    steps: [
      "Enter email and password.",
      "Enter the code received by email if requested.",
      "Access the dashboard that matches your role.",
    ],
    rules: [
      "The temporary code expires after 15 minutes.",
      "The code can be used only once.",
      "In development, two-step login can be disabled by configuration.",
    ],
    attention: [
      "An invalid token requires signing in again.",
      "Never share a password or temporary code.",
    ],
  },
  about_page: {
    title: "About page",
    objective: "Present the organization, visible administrators, and program identity.",
    whoCanUse: "Administrators manage the profile content that appears there.",
    actions: [
      "Check published operational administrators.",
      "Approve public changes.",
      "Control consistency of photos, titles, and descriptions.",
    ],
    steps: [
      "Open Administrators.",
      "Review pending profiles.",
      "Approve correct public information.",
      "Check the public About page.",
    ],
    rules: [
      "An edited operational admin profile goes back to pending approval.",
      "Public data does not change without principal approval.",
    ],
    attention: [
      "Do not publish an incomplete or unprofessional description.",
    ],
  },
  teams_public: {
    title: "Team page",
    objective: "Display approved mentors publicly.",
    whoCanUse: "Mentors submit their profile. Administrators approve it.",
    actions: [
      "Mentor: complete the Team profile.",
      "Admin: review and approve requests.",
      "Public: view approved profiles.",
    ],
    steps: [
      "The mentor completes photo, field, short bio, and consent.",
      "The admin opens Teams.",
      "The admin approves and orders the display.",
    ],
    rules: [
      "Without admin approval, the mentor profile must not appear publicly.",
      "The short bio replaces the Goals field.",
    ],
    attention: [
      "A public profile should stay short, clear, and professional.",
    ],
  },
  events: {
    title: "Events",
    objective: "Manage events visible or planned for the program.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Create an event.",
      "Add an image or video.",
      "Edit, view details, or delete.",
      "Plan publication through the status.",
    ],
    steps: [
      "Open Events.",
      "Create or edit the event.",
      "Add media if available.",
      "Use the scheduled status for public display.",
    ],
    rules: [
      "Public events must be scheduled.",
      "Images and videos must remain readable and adapted to the site.",
    ],
    attention: [
      "Check the public rendering after adding media.",
    ],
  },
  partners: {
    title: "Partners",
    objective: "Manage partners displayed on the public site.",
    whoCanUse: "Principal administrator and operational administrator.",
    actions: [
      "Create a partner.",
      "Add its logo and website.",
      "Activate, deactivate, edit, or delete.",
    ],
    steps: [
      "Open Partners.",
      "Enter the main information.",
      "Set display order.",
      "Activate only partners ready to be public.",
    ],
    rules: [
      "Only active partners are displayed publicly.",
      "Logos must be clean and readable.",
    ],
    attention: [
      "Check external links before publication.",
    ],
  },
  mentor_dashboard: {
    title: "Mentor dashboard",
    objective: "Show mentor priorities: mentees, sessions, and progress.",
    whoCanUse: "Signed-in mentors.",
    actions: [
      "Review personal statistics.",
      "See latest sessions.",
      "Identify mentees requiring follow-up.",
    ],
    steps: [
      "Open Dashboard.",
      "Read the summary cards.",
      "Open files or sessions that need action.",
    ],
    rules: [
      "A mentor sees only their own assignments.",
      "Data comes from related sessions and follow-ups.",
    ],
    attention: [
      "If no data appears, check that an active assignment exists.",
    ],
  },
  mentor_mentees: {
    title: "Mentor mentees",
    objective: "Review mentees assigned to the mentor.",
    whoCanUse: "Signed-in mentors.",
    actions: [
      "View the mentee list.",
      "Check progress.",
      "Open a mentee file.",
    ],
    steps: [
      "Open Mentees.",
      "Identify the file to review.",
      "Click View file.",
    ],
    rules: [
      "Only mentees assigned to the signed-in mentor are visible.",
      "Progress depends on completed sessions.",
    ],
    attention: [
      "A missing mentee may not be assigned in the active session.",
    ],
  },
  mentor_mentee_file: {
    title: "Mentee file",
    objective: "Centralize sessions, comments, and progress for one mentee.",
    whoCanUse: "Mentor responsible for the mentee.",
    actions: [
      "View the file summary.",
      "Schedule a session.",
      "Review session follow-ups.",
    ],
    steps: [
      "Open Mentees.",
      "Click View file.",
      "Check progress and sessions.",
      "Create a session if needed.",
    ],
    rules: [
      "A mentor can view only files assigned to them.",
      "Each session must remain linked to the active assignment.",
    ],
    attention: [
      "Comments must be useful, respectful, and factual.",
    ],
  },
  mentor_sessions: {
    title: "Mentor sessions",
    objective: "Schedule and update mentorship meetings.",
    whoCanUse: "Signed-in mentors.",
    actions: [
      "Create a session.",
      "Edit a session.",
      "View session details.",
      "Change the status when the meeting is completed.",
    ],
    steps: [
      "Open Sessions.",
      "Click Create session.",
      "Choose the mentee and enter date, time, and subject.",
      "Update the status after the meeting.",
    ],
    rules: [
      "Date and session number are required.",
      "Start time must be before end time.",
      "The session number must not exceed the planned count.",
    ],
    attention: [
      "A session that did not happen must not be marked completed.",
    ],
  },
  mentor_followups: {
    title: "Mentor follow-ups",
    objective: "Document assessment, observations, and recommendations after sessions.",
    whoCanUse: "Signed-in mentors.",
    actions: [
      "View completed sessions.",
      "Open follow-up details.",
      "Update assessment and recommendations.",
    ],
    steps: [
      "Open Follow-ups.",
      "Choose a completed session.",
      "Click Update.",
      "Save the assessment and useful notes.",
    ],
    rules: [
      "Progress percentage is calculated automatically.",
      "Notes must remain professional.",
    ],
    attention: [
      "Avoid unnecessary or overly personal information.",
    ],
  },
  mentor_public_profile: {
    title: "Mentor public profile",
    objective: "Submit information visible on the Team page.",
    whoCanUse: "Signed-in mentors.",
    actions: [
      "Add a photo.",
      "Enter field or specialty.",
      "Write the short bio.",
      "Consent to public appearance.",
    ],
    steps: [
      "Open Settings.",
      "Choose Team profile.",
      "Complete all required fields.",
      "Save and wait for admin approval.",
    ],
    rules: [
      "Public publication requires admin approval.",
      "Photo, field, short bio, and consent are required.",
    ],
    attention: [
      "Photo and short bio should remain professional.",
    ],
  },
  mentor_settings: {
    title: "Mentor settings",
    objective: "Manage personal information, public profile, and mentorship session.",
    whoCanUse: "Signed-in mentors.",
    actions: [
      "Update first and last name.",
      "Change password.",
      "Complete the public Team profile.",
      "Choose a new session only when allowed.",
    ],
    steps: [
      "Open Settings.",
      "Choose Account, Team profile, or Mentorship session.",
      "Edit only authorized information.",
      "Save and read the confirmation message.",
    ],
    rules: [
      "The mentor cannot edit role or permissions.",
      "Session change is limited to cases planned by administration.",
    ],
    attention: [
      "If no new session is available, wait for admin creation.",
    ],
  },
};

function localizeHelpModule(module: HelpModule, language: Language): HelpModule {
  if (language !== "en") {
    return module;
  }

  return {
    ...module,
    ...englishHelpContent[module.key],
  };
}

export function normalizeHelpRole(roleName?: string | null, scope?: HelpScope): HelpRole | undefined {
  if (scope === "mentor") {
    return "MENTOR";
  }
  if (roleName === "ADMIN_PRINCIPAL" || roleName === "ADMIN_OPERATIONNEL" || roleName === "MENTOR") {
    return roleName;
  }
  return undefined;
}

export function getHelpModule(moduleKey: HelpModuleKey, language: Language = "fr") {
  const foundModule = helpModules.find((helpModule) => helpModule.key === moduleKey);
  return foundModule ? localizeHelpModule(foundModule, language) : undefined;
}

export function getHelpModulesForRole(role: HelpRole | undefined, scope: HelpScope, language: Language = "fr") {
  return helpModules.filter((module) => {
    if (scope === "admin" && module.scope === "mentor") {
      return false;
    }
    if (scope === "mentor" && module.scope === "admin") {
      return false;
    }
    return role ? module.roles.includes(role) : module.scope === scope || module.scope === "shared";
  }).map((module) => localizeHelpModule(module, language));
}
