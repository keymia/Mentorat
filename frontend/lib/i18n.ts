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
  Aide: "Help",
  Fermer: "Close",
  "Voir toute la documentation": "View full documentation",
  "Documentation complete": "Full documentation",
  Rechercher: "Search",
  "Aucun resultat": "No result",
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
  "Nombre maximal de mentores par mentor": "Maximum number of mentees per mentor",
  "Maximum de mentores par mentor": "Maximum mentees per mentor",
  "Export recommande": "Export recommended",
  "Creer une periode de mentorat": "Create a mentorship period",
  "Creer la periode": "Create period",
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
  Appellation: "Salutation",
  "Selectionnez une appellation": "Select a salutation",
  "Titre / diplome": "Title / degree",
  "Selectionnez un titre ou diplome": "Select a title or degree",
  "Aucun titre selectionne": "No title selected",
  "Selectionnez au moins un titre ou diplome pour l'affichage public.": "Select at least one title or degree for public display.",
  "Affichage :": "Display:",
  "Titre ou diplome personnalise": "Custom title or degree",
  "Identite publique": "Public identity",
  Autre: "Other",
  "Non valide": "Not validated",
  "Non validee": "Not validated",
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
  "L'email est obligatoire.": "Email is required.",
  "Le mot de passe est obligatoire.": "Password is required.",
  "Le code temporaire est obligatoire.": "Temporary code is required.",
  "Identifiants invalides. Verifiez votre email et votre mot de passe.":
    "Invalid credentials. Check your email and password.",
  "Ce compte n'est pas autorise a se connecter pour le moment.":
    "This account is not authorized to sign in right now.",
  "Le code temporaire est invalide ou expire.": "The temporary code is invalid or expired.",
  "Le serveur a rencontre un probleme. Reessayez dans un instant.":
    "The server encountered a problem. Please try again shortly.",
  "Ouvrir le menu admin": "Open admin menu",
  "Fermer le menu admin": "Close admin menu",
  "Mon compte": "My account",
  "Administrateur principal": "Principal administrator",
  "Administrateur operationnel": "Operational administrator",
  "Numéro attribué": "Assigned number",
  "Séance marquee comme realisee.": "Session marked as completed.",
  Realiser: "Complete",
  "Supprimer cet evenement ?": "Delete this event?",
  "Supprimer ce partenaire ?": "Delete this partner?",
  "Supprimer cet administrateur ?": "Delete this administrator?",
  "Supprimer cette periode ?": "Delete this period?",
  "Voulez-vous vraiment supprimer cet element ? Cette action est irreversible.":
    "Are you sure you want to delete this item? This action cannot be undone.",
  "Supprimer l'evenement": "Delete event",
  "Supprimer le partenaire": "Delete partner",
  "Supprimer l'administrateur": "Delete administrator",
  "Supprimer la periode": "Delete period",
  "Suppression...": "Deleting...",
  "Gestion des equipes": "Team management",
  "Validez les mentors qui ont accepte d'apparaitre publiquement et definissez leur ordre d'affichage.":
    "Approve mentors who agreed to appear publicly and set their display order.",
  "Seul l'administrateur principal peut creer, modifier, desactiver ou supprimer ces comptes.":
    "Only the principal administrator can create, edit, deactivate, or delete these accounts.",
  "Créer un administrateur": "Create administrator",
  "Créer un administrateur operationnel": "Create operational administrator",
  "Séances de mentorat": "Mentorship sessions",
  "Consultez les seances programmees, realisees, reportees ou annulees.":
    "Review scheduled, completed, postponed, or cancelled sessions.",
  "Créer une séance": "Create session",
  "Séance programmée.": "Session scheduled.",
  "Séance créée.": "Session created.",
};

const frenchPolishDictionary: Record<string, string> = {
  "A propos": "À propos",
  Equipes: "Équipes",
  Evenements: "Événements",
  Parametres: "Paramètres",
  "Periode de mentorat": "Période de mentorat",
  "Periodes de mentorat": "Périodes de mentorat",
  Seances: "Séances",
  Mentores: "Mentorés",
  Mentore: "Mentoré",
  "Formulaire mentore": "Formulaire mentoré",
  "Inscription mentore": "Inscription mentoré",
  "Soumettre l'inscription mentore": "Soumettre l’inscription mentoré",
  "Ouvrir le formulaire mentore": "Ouvrir le formulaire mentoré",
  "Aucun mentore a afficher pour le moment.": "Aucun mentoré à afficher pour le moment.",
  "Creer un mentore": "Créer un mentoré",
  "Gestion mentores": "Gestion des mentorés",
  "Mes mentores": "Mes mentorés",
  "Dossiers, seances et progression par mentore.": "Dossiers, séances et progression par mentoré.",
  "Mes seances": "Mes séances",
  "Rencontres programmees, realisees et a mettre a jour.": "Rencontres programmées, réalisées et à mettre à jour.",
  "Mettez a jour les seances realisees, l'appreciation et l'avancement des mentores.":
    "Mettez à jour les séances réalisées, l’appréciation et l’avancement des mentorés.",
  "Affectations, seances et suivis actifs.": "Affectations, séances et suivis actifs.",
  "Compte et session de mentorat.": "Compte et période de mentorat.",
  "Donnees de compte disponibles pour votre espace mentor.": "Données de compte disponibles pour votre espace mentor.",
  "Session de mentorat": "Période de mentorat",
  "Session a choisir": "Période à choisir",
  "Choisir une session": "Choisir une période",
  "Choisir une periode": "Choisir une période",
  "Selectionnez une session.": "Sélectionnez une période.",
  "Session introuvable.": "Période introuvable.",
  "Aucune nouvelle session disponible.": "Aucune nouvelle période disponible.",
  "Nouvelle session enregistree.": "Nouvelle période enregistrée.",
  "Aucune session de mentorat n'est associee a votre compte pour le moment.":
    "Aucune période de mentorat n’est associée à votre compte pour le moment.",
  "Consultez la session actuelle et choisissez une nouvelle session uniquement lorsque la session en cours est expiree.":
    "Consultez la période actuelle et choisissez une nouvelle période uniquement lorsque la période en cours est expirée.",
  "La session en cours n'est pas encore expiree.": "La période en cours n’est pas encore expirée.",
  "Aucune session expiree ne peut etre reconduite.": "Aucune période expirée ne peut être reconduite.",
  "Mentorer, soutenir et elever la releve academique.": "Mentorer, soutenir et élever la relève académique.",
  "BMC Mentorat connecte mentors et mentores dans un cadre exigeant, humain et structure autour de la progression academique.":
    "BMC Mentorat met en relation mentors et mentorés dans un cadre exigeant, humain et structuré autour de la progression académique.",
  "Mentors inscrits, valides et suivis par l'administration.":
    "Mentors inscrits, validés et suivis par l’administration.",
  "Choix du mentor selon le niveau academique superieur direct.": "Choix du mentor selon le niveau académique supérieur direct.",
  Communaute: "Communauté",
  "Un parcours simple, verifie et mesurable.": "Un parcours simple, vérifié et mesurable.",
  "La plateforme applique les regles metier au moment de l'inscription et au moment de la validation administrative.":
    "La plateforme applique les règles métier au moment de l’inscription et lors de la validation administrative.",
  "Les inscriptions sont creees en attente, puis validees par l'administration.":
    "Les inscriptions sont créées avec le statut « en attente », puis validées par l’administration.",
  "Pour les etudiants admissibles qui souhaitent accompagner.": "Pour les étudiants admissibles qui souhaitent accompagner.",
  "Pour choisir un mentor du niveau academique superieur direct.": "Pour choisir un mentor du niveau académique supérieur direct.",
  "Indiquez votre niveau academique et vos informations de profil.": "Indiquez votre niveau académique et vos informations de profil.",
  "Choisissez la periode, votre niveau et un mentor disponible.": "Choisissez la période, votre niveau et un mentor disponible.",
  Prenom: "Prénom",
  Telephone: "Numéro de téléphone",
  "Langue preferee": "Langue préférée",
  Francais: "Français",
  "Niveau academique": "Niveau académique",
  "Choisir un niveau": "Sélectionnez un niveau",
  "Capacite de mentorat": "Capacité de mentorat",
  "Envoi...": "Envoi en cours...",
  "Votre inscription mentor a ete envoyee et sera validee par l'administration.":
    "Votre inscription comme mentor a été envoyée et sera validée par l’administration.",
  "Votre inscription mentore a ete envoyee et sera validee par l'administration.":
    "Votre inscription comme mentoré a été envoyée et sera validée par l’administration.",
  "Donnees d'inscription indisponibles:": "Données d’inscription indisponibles :",
  "Mentors indisponibles:": "Mentors indisponibles :",
  "Un cadre de mentorat academique simple a administrer": "Un cadre de mentorat académique simple à administrer",
  "Mentorat connecte les etudiants selon une progression academique claire, avec validation administrative et suivi des capacites.":
    "Mentorat relie les étudiants selon une progression académique claire, avec validation administrative et suivi des capacités.",
  "Chaque mentore avance avec un mentor du niveau academique superieur direct.":
    "Chaque mentoré progresse avec un mentor du niveau académique supérieur direct.",
  Equite: "Équité",
  "Les capacites de mentorat sont controlees pour proteger la qualite de l'accompagnement.":
    "Les capacités de mentorat sont contrôlées afin de préserver la qualité de l’accompagnement.",
  "Les inscriptions et jumelages restent valides par l'administration.":
    "Les inscriptions et les jumelages restent validés par l’administration.",
  "Un parcours construit autour des niveaux academiques": "Un parcours construit autour des niveaux académiques",
  "La regle centrale est volontairement stricte: un mentore choisit uniquement un mentor du niveau superieur direct.":
    "La règle centrale est volontairement stricte : un mentoré choisit uniquement un mentor du niveau supérieur direct.",
  "Contacter l'equipe Mentorat": "Contacter l’équipe Mentorat",
  "Cette page est un point d'entree simple pour les demandes liees au programme.":
    "Cette page est un point d’entrée simple pour les demandes liées au programme.",
  "Evenements du programme": "Événements du programme",
  "Cette page publique est prete a recevoir les ateliers, conferences et activites de reseautage exposes par l'API.":
    "Cette page publique est prête à présenter les ateliers, conférences et activités de réseautage publiés par l’API.",
  "Aucun evenement planifie": "Aucun événement planifié",
  "Les evenements seront listes ici lorsque l'administration les publiera avec le statut PLANIFIE.":
    "Les événements seront affichés ici lorsque l’administration les publiera avec le statut « Planifié ».",
  "Lieu a confirmer": "Lieu à confirmer",
  "Seuls les partenaires actifs sont affiches sur le site public.": "Seuls les partenaires actifs sont affichés sur le site public.",
  "Aucun partenaire actif a afficher pour le moment.": "Aucun partenaire actif à afficher pour le moment.",
  "Indiquez votre niveau academique et les informations utiles a votre profil mentor.":
    "Indiquez votre niveau académique et les informations utiles à votre profil mentor.",
  "Apres le choix du niveau academique, la liste affiche uniquement les mentors actifs du niveau superieur direct avec une capacite disponible.":
    "Après le choix du niveau académique, la liste affiche uniquement les mentors actifs du niveau supérieur direct ayant une capacité disponible.",
  "Utilisez votre email et votre mot de passe. Le systeme ouvrira automatiquement l'espace admin ou mentor.":
    "Utilisez votre adresse courriel et votre mot de passe. Le système ouvrira automatiquement l’espace administrateur ou mentor.",
  "Documentation complete": "Documentation complète",
  "Aucun resultat": "Aucun résultat",
  "Vue d'ensemble du programme BMC Mentorat.": "Vue d’ensemble du programme BMC Mentorat.",
  "Gestion des inscriptions, jumelages, evenements, partenaires et parametres.":
    "Gestion des inscriptions, jumelages, événements, partenaires et paramètres.",
  "Nombre maximal de mentores par mentor": "Nombre maximal de mentorés par mentor",
  "Maximum de mentores par mentor": "Maximum de mentorés par mentor",
  "Export recommande": "Export recommandé",
  "Creer une periode de mentorat": "Créer une période de mentorat",
  "Creer la periode": "Créer la période",
  Deconnexion: "Déconnexion",
  "Liste lisible des mentors et des profils mentor et mentore.":
    "Liste lisible des mentors et des profils mentor et mentoré.",
  "Liste lisible des mentores et des profils mentor et mentore.":
    "Liste lisible des mentorés et des profils mentor et mentoré.",
  "Administrateurs operationnels": "Administrateurs opérationnels",
  "Cette section doit etre utilisee par ADMIN_PRINCIPAL; le backend bloque la creation d'administrateurs par ADMIN_OPERATIONNEL.":
    "Cette section est réservée à l’administrateur principal ; le backend empêche la création d’administrateurs par un administrateur opérationnel.",
  "Suivi des emails automatiques.": "Suivi des courriels automatiques.",
  "Reservations automatiques desactivees": "Réservations automatiques désactivées",
  "Les rencontres sont maintenant programmees par le mentor dans le cadre de la periode active.":
    "Les rencontres sont maintenant programmées par le mentor dans le cadre de la période active.",
  "Votre mentor vous communiquera les dates des seances. Les commentaires et suivis sont geres par le mentor et visibles par l'administration.":
    "Votre mentor vous communiquera les dates des séances. Les commentaires et les suivis sont gérés par le mentor et visibles par l’administration.",
  "Non renseigne": "Non renseigné",
  "Informations personnelles mises a jour.": "Informations personnelles mises à jour.",
  "Mettez a jour les donnees principales de votre compte mentor.":
    "Mettez à jour les données principales de votre compte mentor.",
  "Basculer la langue": "Changer de langue",
  "Une plateforme de mentorat academique inspiree par l'excellence, le soutien et la communaute.":
    "Une plateforme de mentorat académique inspirée par l’excellence, le soutien et la communauté.",
  "Mentors satures": "Mentors saturés",
  "Priorites rapides": "Priorités rapides",
  "Profils mentors et mentor+mentore actifs.": "Profils mentors et mentor+mentoré actifs.",
  "Profils mentores suivis dans la plateforme.": "Profils mentorés suivis dans la plateforme.",
  "Inscriptions a valider ou refuser.": "Inscriptions à valider ou à refuser.",
  "Mentors avec une capacite restante.": "Mentors avec une capacité restante.",
  "Mentors ayant atteint leur capacite.": "Mentors ayant atteint leur capacité.",
  "Evenements a venir": "Événements à venir",
  "Evenements planifies dans le programme.": "Événements planifiés dans le programme.",
  "Aucune donnee pour le moment.": "Aucune donnée disponible pour le moment.",
};

const exactFrenchToEnglish = new Map(
  Object.entries(englishDictionary).map(([french, english]) => [normalizeKey(french), english]),
);

const exactEnglishToFrench = new Map(
  Object.entries(englishDictionary).map(([french, english]) => [normalizeKey(english), french]),
);

const exactFrenchPolish = new Map(
  Object.entries(frenchPolishDictionary).map(([source, polished]) => [normalizeKey(source), polished]),
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
  { from: /^(.+) at (\d{2}:\d{2})$/, to: (_, date, time) => `${date} à ${time}` },
  { from: /^Image of (.+)$/, to: (_, name) => `Image de ${name}` },
  { from: /^Logo of (.+)$/, to: (_, name) => `Logo de ${name}` },
  { from: /^Opinion: (.+)$/, to: (_, value) => `Avis : ${value}` },
  { from: /^(\d+) item$/, to: (_, count) => `${count} élément` },
  { from: /^(\d+) items$/, to: (_, count) => `${count} éléments` },
  { from: /^(\d+) registration\(s\) are awaiting an administrative decision\.$/, to: (_, count) => `${count} inscription(s) attendent une décision administrative.` },
  { from: /^(\d+) mentor\(s\) can still accept mentees\.$/, to: (_, count) => `${count} mentor(s) peuvent encore accepter des mentorés.` },
  { from: /^(\d+) scheduled event\(s\) are visible or upcoming\.$/, to: (_, count) => `${count} événement(s) planifié(s) sont visibles ou à venir.` },
  { from: /\((\d+) slot\)$/, to: (_, count) => `(${count} place)` },
  { from: /\((\d+) slots\)$/, to: (_, count) => `(${count} places)` },
];

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string) {
  return stripDiacritics(value)
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
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

function polishFrenchText(value: string) {
  return exactFrenchPolish.get(normalizeKey(value)) ?? value;
}

export function translateText(value: string, language: Language) {
  const normalizedValue = normalizeKey(value);
  if (!normalizedValue) {
    return value;
  }

  if (language === "fr") {
    const exactMatch = exactEnglishToFrench.get(normalizedValue);
    if (exactMatch) {
      return preserveWhitespace(value, polishFrenchText(exactMatch));
    }

    const translated = translateWithPatterns(normalizedValue, englishToFrenchPatterns);
    const frenchValue = translated === normalizedValue ? compactText(value) : translated;
    return preserveWhitespace(value, polishFrenchText(frenchValue));
  }

  const exactMatch = exactFrenchToEnglish.get(normalizedValue);

  if (exactMatch) {
    return preserveWhitespace(value, exactMatch);
  }

  const translated = translateWithPatterns(normalizedValue, frenchToEnglishPatterns);
  if (translated === normalizedValue) {
    return value;
  }

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
