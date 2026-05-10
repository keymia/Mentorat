# CONTEXT.md — Programme X

## 1. Stack technique

Le projet utilise :

- Backend : Django
- API : Django REST Framework
- Base de données : PostgreSQL
- Frontend : Next.js
- Authentification : déjà existante
- Rôles : administrateur, mentor, mentoré

Le code existant ne doit pas être cassé. Toute amélioration doit respecter l’architecture actuelle.

---

## 2. Objectif général du projet

Programme X est une plateforme de mentorat permettant de gérer :

- les administrateurs
- les mentors
- les mentorés
- les périodes de mentorat
- les affectations mentor / mentoré
- les séances de mentorat
- le suivi de l’avancement des mentorés
- les commentaires et avis des mentors
- les partenaires affichés sur le site
- un chatbot d’assistance

---

## 3. Règles métier principales

### Rôles

Il existe trois rôles principaux :

- Administrateur
- Mentor
- Mentoré

### Mentorat par niveau

- Le mentoré choisit un mentor lors de son inscription.
- La liste des mentors affichés dépend du niveau du mentoré.
- Un mentor ne peut mentorer que les étudiants du niveau inférieur direct.
- Un étudiant de niveau supérieur peut être mentor et aussi mentoré.
- Les étudiants de dernière année sont uniquement mentors.
- Les étudiants de 12e année sont uniquement mentorés.
- Un mentor peut choisir de ne pas être mentoré.

---

## 4. Nouvelle décision importante

La gestion des disponibilités libres des mentors doit être retirée.

Il ne faut plus demander au mentor de remplir ses disponibilités pendant l’année.

Le propriétaire ou l’administrateur doit plutôt définir :

- le début d’une période de mentorat
- la fin d’une période de mentorat
- le nombre de séances à programmer entre chaque mentor et mentoré pendant cette période

Les mentors programmeront ensuite les dates de rencontre avec leurs mentorés dans leur propre espace.

---

## 5. Période de mentorat

L’administrateur doit pouvoir créer une période de mentorat.

Une période contient :

- titre
- description optionnelle
- date de début
- date de fin
- nombre de séances obligatoires
- statut : brouillon, active, terminée, archivée
- date de création
- date de modification

Exemple :

Session hiver 2026  
Début : 15 janvier 2026  
Fin : 30 avril 2026  
Nombre de séances : 8

---

## 6. Affectation mentor / mentoré

Une affectation représente la relation entre un mentor et un mentoré pendant une période donnée.

Une affectation contient :

- mentor
- mentoré
- période de mentorat
- statut : active, terminée, suspendue
- date d’affectation
- notes administratives optionnelles

Règles :

- Une affectation appartient toujours à une période.
- Un mentor peut avoir plusieurs mentorés.
- Un mentoré ne doit pas avoir plusieurs mentors actifs pour la même période.
- Le nombre de mentorés d’un mentor doit respecter la limite définie.
- Les règles de niveau doivent être respectées.

---

## 7. Séances de mentorat

Les séances sont programmées par le mentor dans son espace.

Une séance contient :

- affectation mentor / mentoré
- numéro de séance
- date prévue
- heure de début optionnelle
- heure de fin optionnelle
- statut : programmée, réalisée, annulée, reportée, absente
- résumé de la séance
- commentaire du mentor
- date de création
- date de modification

Règles :

- Le nombre total de séances attendues vient de la période de mentorat.
- Le mentor peut programmer les dates de rencontre.
- Une séance doit être dans les dates de la période.
- L’administrateur doit voir les séances programmées et réalisées.
- Le système doit pouvoir afficher les séances restantes.

---

## 8. Suivi de l’avancement du mentoré

Chaque mentor doit pouvoir suivre l’évolution de chaque mentoré.

Le suivi contient :

- affectation mentor / mentoré
- statut d’avancement : excellent, bon, moyen, à surveiller, en difficulté
- progression en pourcentage optionnelle
- difficultés rencontrées
- progrès observés
- recommandations
- avis général du mentor
- date de dernière mise à jour

L’administrateur doit pouvoir consulter ces informations.

---

## 9. Espace mentor

Le mentor doit avoir son propre tableau de bord.

Il doit pouvoir :

- voir ses mentorés
- voir la période de mentorat active
- voir le nombre de séances obligatoires
- voir les séances déjà programmées
- voir les séances réalisées
- programmer une date de rencontre
- modifier une séance
- annuler ou reporter une séance
- marquer une séance comme réalisée
- ajouter un résumé de séance
- ajouter un commentaire sur le mentoré
- suivre l’avancement du mentoré
- écrire un avis général sur chaque mentoré

---

## 10. Espace administrateur

L’administrateur doit pouvoir :

- créer une période de mentorat
- modifier une période
- activer ou terminer une période
- affecter des mentors aux mentorés
- consulter toutes les affectations
- consulter toutes les séances
- voir les séances programmées
- voir les séances réalisées
- voir les séances manquantes
- consulter les commentaires des mentors
- consulter les avis sur les mentorés
- consulter l’avancement des mentorés
- filtrer par mentor, mentoré, période, statut

---

## 11. Ce qu’il faut supprimer ou ne pas développer

Ne pas développer :

- formulaire de disponibilités annuelles du mentor
- calendrier de disponibilités libres
- exceptions de disponibilité
- réservation automatique par créneaux
- sélection automatique selon disponibilités

Remplacer cette logique par :

- période de mentorat définie par l’administrateur
- nombre de séances défini par l’administrateur
- programmation manuelle des rencontres par le mentor
- suivi visible par l’administration

---

## 12. Modèles recommandés

### MentorshipPeriod

Champs recommandés :

- title
- description
- start_date
- end_date
- required_sessions
- status
- created_at
- updated_at

### MentorshipAssignment

Champs recommandés :

- mentor
- mentoree
- period
- status
- admin_notes
- assigned_at
- created_at
- updated_at

### MentorshipSession

Champs recommandés :

- assignment
- session_number
- scheduled_date
- start_time
- end_time
- status
- summary
- mentor_comment
- created_at
- updated_at

### MentoreeProgress

Champs recommandés :

- assignment
- progress_status
- progress_percentage
- difficulties
- achievements
- recommendations
- mentor_opinion
- updated_at

---

## 13. API REST recommandée

### Périodes de mentorat

- GET /api/mentorship-periods/
- POST /api/mentorship-periods/
- GET /api/mentorship-periods/{id}/
- PUT /api/mentorship-periods/{id}/
- PATCH /api/mentorship-periods/{id}/
- DELETE /api/mentorship-periods/{id}/

### Affectations

- GET /api/mentorship-assignments/
- POST /api/mentorship-assignments/
- GET /api/mentorship-assignments/{id}/
- PATCH /api/mentorship-assignments/{id}/

### Espace mentor

- GET /api/mentor/dashboard/
- GET /api/mentor/mentees/
- GET /api/mentor/mentees/{id}/
- GET /api/mentor/assignments/
- GET /api/mentor/assignments/{id}/sessions/
- POST /api/mentor/assignments/{id}/sessions/
- PATCH /api/mentor/sessions/{id}/
- PATCH /api/mentor/sessions/{id}/complete/
- GET /api/mentor/assignments/{id}/progress/
- PATCH /api/mentor/assignments/{id}/progress/

### Espace administrateur

- GET /api/admin/mentorship-overview/
- GET /api/admin/mentorship-sessions/
- GET /api/admin/mentorship-progress/
- GET /api/admin/mentorship-reports/

---

## 14. Frontend recommandé

### Pages administrateur

- /admin/mentorship/periods
- /admin/mentorship/assignments
- /admin/mentorship/sessions
- /admin/mentorship/progress
- /admin/mentorship/reports

### Pages mentor

- /mentor/dashboard
- /mentor/mentees
- /mentor/mentees/[id]
- /mentor/sessions
- /mentor/progress

### Fonctionnalités mentor

Sur la page d’un mentoré, le mentor doit voir :

- informations du mentoré
- période active
- nombre de séances prévues
- séances programmées
- séances réalisées
- séances restantes
- formulaire de programmation de séance
- formulaire de résumé de séance
- formulaire de suivi d’avancement
- champ pour avis général

---

## 15. Contraintes importantes

- Ne pas casser l’existant.
- Lire l’architecture actuelle avant de modifier.
- Réutiliser les modèles existants si possible.
- Ne pas dupliquer inutilement les utilisateurs.
- Respecter les permissions par rôle.
- Les mentors ne doivent voir que leurs propres mentorés.
- Les administrateurs peuvent tout voir.
- Les mentorés ne doivent pas modifier les suivis écrits par les mentors.
- Toutes les dates doivent être validées côté backend.
- PostgreSQL est la base de données utilisée.
