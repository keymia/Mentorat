# Mentorat

Plateforme de mentorat academique avec backend Django REST Framework, PostgreSQL, JWT et frontend Next.js.

## Structure

```text
backend/
  config/
  apps/
    users/
    inscriptions/
    mentorat/
    evenements/
    partenaires/
    emails/
    parametres/
    statistiques/
frontend/
  app/
  components/
  lib/api.ts
```

## Backend

1. Creer la base PostgreSQL:

```powershell
createdb mentorat
```

2. Configurer l'environnement:

```powershell
Copy-Item backend\.env.example backend\.env
```

Modifier `backend/.env` avec vos valeurs PostgreSQL:

```text
POSTGRES_DB=mentorat
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

3. Installer et migrer:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py initialiser_mentorat --admin-email admin@mentorat.local --admin-password "MotDePasseFort123!"
python manage.py runserver
```

Les migrations creent aussi les roles, les niveaux academiques de depart et `MAX_MENTORES_PAR_MENTOR=5`. La commande `initialiser_mentorat` est idempotente: elle reverifie ces donnees et cree le premier `ADMIN_PRINCIPAL` si aucun n'existe.

Variables possibles pour l'admin initial:

```text
INITIAL_ADMIN_EMAIL=admin@mentorat.local
INITIAL_ADMIN_PASSWORD=MotDePasseFort123!
INITIAL_ADMIN_NOM=Principal
INITIAL_ADMIN_PRENOM=Admin
```

## Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

URL locale: `http://localhost:3000`

## API Principales

- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- `GET /api/users/`
- `GET /api/mentors/disponibles/?niveau_id=ID`
- `POST /api/inscriptions/mentor/`
- `POST /api/inscriptions/mentore/`
- `PUT /api/inscriptions/:id/valider/`
- `PUT /api/inscriptions/:id/refuser/`
- `GET /api/partenaires/public/`
- `GET /api/statistiques/dashboard/`
- Documentation Swagger: `http://127.0.0.1:8000/api/docs/`

## Notes de securite

- Toutes les routes admin backend exigent un JWT valide et un role administrateur.
- `ADMIN_OPERATIONNEL` ne peut pas creer d'administrateur.
- Le backend valide toujours la capacite du mentor et le niveau superieur direct avant un jumelage.
- La validation d'une inscription mentore cree automatiquement le jumelage actif si le mentor choisi est encore admissible.
- Les pages `/admin` du frontend sont protegees par un cookie JWT de session cote Next.js; les permissions definitives restent cote backend.
