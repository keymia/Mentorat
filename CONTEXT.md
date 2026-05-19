# CONTEXT.md — Programme X

## 1. Stack technique

Le projet utilise :

- Backend : Django
- API : Django REST Framework
- Base de données : PostgreSQL
- Frontend : Next.js
- Authentification : déjà existante

Le code existant ne doit pas être cassé.
Toute amélioration doit respecter l’architecture actuelle.

---

# 2. Objectif général du projet

Programme X est une plateforme de mentorat permettant de gérer :

- les administrateurs principaux
- les administrateurs opérationnels
- les mentors
- les mentorés
- les périodes de mentorat
- les affectations mentor / mentoré
- les séances de mentorat
- le suivi des mentorés
- les équipes publiques
- les rapports et archives
- les importations/exportations
- un chatbot d’assistance

---

# 3. Rôles du système

Le projet possède 4 rôles :

- Administrateur principal
- Administrateur opérationnel
- Mentor
- Mentoré

---

## Administrateur principal

L’administrateur principal possède tous les droits.

Il peut :

- créer des administrateurs opérationnels
- désactiver un administrateur opérationnel
- supprimer un administrateur opérationnel
- créer des sessions / périodes de mentorat
- définir le nombre maximal de mentorés
- gérer toute la plateforme
- voir toutes les données
- gérer les imports/exports
- gérer les équipes
- gérer les rapports

---

## Administrateur opérationnel

L’administrateur opérationnel possède presque tous les droits administratifs.

Il peut :

- gérer les mentors
- gérer les mentorés
- gérer les affectations
- gérer les séances
- gérer les suivis
- gérer les équipes
- valider les mentors publics
- importer/exporter les données
- consulter les rapports

Il ne peut PAS :

- créer un administrateur opérationnel
- supprimer un administrateur opérationnel
- désactiver un administrateur opérationnel
- créer une session / période de mentorat
- modifier le nombre maximal de mentorés

---

## Mentor

Le mentor possède un dashboard personnel.

Il peut :

- voir ses mentorés
- programmer des séances
- modifier des séances
- compléter les suivis
- ajouter des recommandations
- ajouter des observations
- compléter son profil public
- demander à apparaître sur la page Équipes

Important :
Un mentor peut également être mentoré en même temps selon son niveau académique.

---

## Mentoré

Le mentoré reçoit un accompagnement.

Important :

- les mentorés n’ont PAS de dashboard
- les mentorés ne passent PAS par la double authentification

---

# 4. Mentorat par niveau

## Niveaux mentors

Choix possibles :

1. Je suis étudiant(e) au collège ou en 1ère / 2e année de baccalauréat
2. Je suis étudiant(e) en 3e / 4e année de baccalauréat ou à la maîtrise
3. Je suis étudiant(e) en médecine

---

## Niveaux mentorés

Choix possibles :

1. Je suis au secondaire
2. Je suis étudiant(e) au collège ou en 1ère / 2e année de baccalauréat
3. Je suis étudiant(e) en 3e / 4e année de baccalauréat ou à la maîtrise

---

## Règles métier importantes

- Un mentor peut également être mentoré en même temps.
- Les étudiants du secondaire sont uniquement mentorés.
- Les étudiants en médecine sont uniquement mentors.
- Un mentor ne peut accompagner que le niveau inférieur direct.
- La liste des mentors dépend du niveau du mentoré.

### Exemples

- un étudiant en médecine = mentor uniquement
- un étudiant du secondaire = mentoré uniquement
- un étudiant à la maîtrise = mentor et mentoré possibles

---

# 5. Périodes de mentorat

Le système fonctionne par sessions / périodes de mentorat.

Une période contient :

- titre
- description
- date de début
- date de fin
- nombre de séances obligatoires
- statut :
  - brouillon
  - active
  - terminée
  - archivée

Exemple :

Session Hiver 2026

- début : 15 janvier 2026
- fin : 30 avril 2026
- séances obligatoires : 8

---

# 6. Affectations mentor / mentoré

Une affectation contient :

- mentor
- mentoré
- période
- statut
- date d’affectation
- notes administratives

Règles :

- une affectation appartient à une période
- un mentor peut avoir plusieurs mentorés
- un mentoré ne peut pas avoir plusieurs mentors actifs dans la même période
- le nombre maximal de mentorés doit être respecté

---

# 7. Gestion des séances

Les mentors programment les séances dans leur dashboard.

Une séance contient :

- affectation
- numéro de séance
- date
- heure de début
- heure de fin
- objet
- statut
- résumé
- commentaires

Statuts possibles :

- programmée
- réalisée
- annulée
- reportée
- absente

---

# 8. Suivi des mentorés

Le mentor doit pouvoir :

- changer le statut d’une séance
- ajouter une appréciation
- ajouter des observations
- ajouter des recommandations

Appréciations possibles :

- Excellent
- Très bon
- Bon
- Moyen
- En difficulté

Le pourcentage d’avancement doit être calculé automatiquement :

(nombre de séance réalisée / nombre total de séances prévues) × 100

---

# 9. Dashboard mentor

Le dashboard mentor possède un sidebar contenant :

- Dashboard
- Mentorés
- Séances
- Suivis

---

## Dashboard

Affiche :

- nombre de mentorés
- séances programmées
- séances réalisées
- progression globale
- dernières activités

---

## Mentorés

Affiche :

- liste des mentorés
- progression
- séances
- bouton Voir dossier

Le dossier mentoré affiche :

- informations générales
- historique des séances
- suivis
- recommandations
- commentaires

---

## Séances

Permet :

- voir les séances
- créer une séance
- modifier une séance
- consulter les détails

---

## Suivis

Permet :

- modifier le statut des séances
- ajouter appréciations
- ajouter observations
- ajouter recommandations

---

# 10. Authentification sécurisée

## Mentors et administrateurs

Connexion en 2 étapes :

1. email + mot de passe
2. code temporaire envoyé par email

Le code :

- expire après 15 minutes
- est à usage unique

L’utilisateur est connecté uniquement après validation du code.

Note temporaire :

- La double authentification par code temporaire est désactivée en développement avec `LOGIN_2FA_ENABLED=False`.
- Le backend utilise encore l’email console si aucun SMTP réel n’est configuré.
- Avant la mise en production, configurer un vrai SMTP (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`) puis remettre `LOGIN_2FA_ENABLED=True`.
- L’adresse d’envoi des codes temporaires sera définie au moment de la configuration SMTP finale.
- Ne pas considérer une adresse locale ou temporaire comme adresse officielle d’envoi des codes.

---

## Inscription mentor

Étapes :

1. formulaire d’inscription
2. validation email par code
3. définition du mot de passe
4. activation du compte

---

## Mentorés

Les mentorés ne passent pas par cette double authentification.

---

# 11. Gestion des équipes publiques

La page publique Programme devient :

Équipes

---

## Affichage des mentors

Un mentor apparaît publiquement uniquement si :

- il a complété son profil
- il a accepté d’apparaître
- il a été validé par un administrateur
- un ordre d’affichage lui a été attribué

---

## Informations affichées

- photo
- nom
- mini bio
- niveau académique
- domaine

La page publique Équipes doit rester moderne et lisible :

- cartes responsives plutôt qu’un tableau public
- photo ou initiales si aucune photo n’est disponible
- nom, domaine, niveau académique et mini bio clairement séparés
- badges et icônes utilisés seulement pour renforcer la hiérarchie
- contraste compatible avec les thèmes clair et sombre

---

# 11.1 Pages publiques longues

Les pages publiques dont le contenu dépasse la hauteur visible doivent permettre le scroll vertical naturel.

À respecter :

- ne pas bloquer le scroll du `html` ou du `body`
- conserver la navbar sticky
- conserver le footer
- permettre aux modales de gérer leur propre verrouillage de scroll pendant leur ouverture

---

# 11.2 Page publique À propos

L’identité publique des administrateurs affichés sur la page À propos doit ressortir davantage que la description.

Règles visuelles :

- appellation, prénom, nom et titre/diplôme utilisent une couleur accentuée du thème BMM
- la description utilise une couleur secondaire plus douce
- le rendu doit rester lisible en mode clair, en mode sombre et sur mobile

---

## Tableaux administrateurs et suppression

Les tableaux administrateurs Mentors, Mentorés et Équipes doivent rester lisibles :

- maximum 5 colonnes visibles
- la 5e colonne est toujours Actions
- les informations secondaires sont accessibles dans Détails
- l’action Supprimer ne doit jamais apparaître directement dans le tableau

La suppression est réservée à l’administrateur principal.

Suppression d’un mentor :

- elle se déclenche uniquement depuis la vue Détails
- elle demande une confirmation explicite
- les mentorés associés sont conservés
- les mentorés sont replacés en attente d’assignation
- les inscriptions concernées repassent en statut de jumelage requis
- les séances, suivis et historiques déjà enregistrés sont conservés

Suppression d’un mentoré :

- elle se déclenche uniquement depuis la vue Détails
- elle demande une confirmation explicite
- elle supprime le mentoré et ses données directement liées
- elle supprime ses relations de mentorat, séances, suivis et inscriptions associées
- elle ne doit pas provoquer de suppression accidentelle d’autres mentorés

Les administrateurs opérationnels peuvent consulter, modifier et gérer les statuts autorisés, mais ils ne peuvent pas supprimer un mentor ou un mentoré.

---

# 12. Mini bio mentor

Le champ Objectif est remplacé par :

Mini bio

Exemple affiché :

“Neter Elysabeth, étudiante en 3ᵉ année du baccalauréat en sciences de la santé à l’Université d’Ottawa et présidente de l’Association des jeunes scientifiques d’Ottawa, se distingue par son engagement à faire rayonner la relève scientifique francophone.”

---

# 13. Archivage et importation des données

L’administrateur doit pouvoir :

- exporter une session complète en Excel
- exporter une session complète en CSV
- importer des données Excel ou CSV

Les exports/imports peuvent concerner :

- mentors
- mentorés
- affectations
- séances
- suivis

---

# 14. Mise à jour des niveaux académiques

À la fin d’une session :

les mentors peuvent :

- garder leur niveau actuel
- passer au niveau supérieur

Ils ne peuvent jamais :

- diminuer leur niveau académique

---

# 15. API REST recommandées

## Authentification

- POST /api/auth/login/request-code/
- POST /api/auth/login/verify-code/
- POST /api/auth/register/start/
- POST /api/auth/register/verify-email-code/
- POST /api/auth/register/set-password/

---

## Mentor

- GET /api/mentor/dashboard/
- GET /api/mentor/mentees/
- GET /api/mentor/sessions/
- POST /api/mentor/sessions/
- PATCH /api/mentor/sessions/{id}/
- GET /api/mentor/follow-ups/

---

## Admin

- GET /api/admin/team-members/
- PATCH /api/admin/team-members/{id}/
- GET /api/admin/mentorship-overview/
- GET /api/admin/sessions/{id}/export/excel/
- GET /api/admin/sessions/{id}/export/csv/
- POST /api/admin/sessions/import/

---

# 16. Contraintes importantes

- Ne pas casser l’existant
- Réutiliser les modèles existants
- Réutiliser les composants existants
- Respecter les permissions par rôle
- Les mentors voient uniquement leurs données
- Les mentorés n’ont pas de dashboard
- Toutes les validations importantes doivent être faites côté backend
- PostgreSQL est la base de données utilisée
