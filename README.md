Cafe Fausse — Local development scaffold

Overview

This repository contains a minimal local-first scaffold for the Cafe Fausse interactive web app assignment.
It includes a Flask backend, a small React frontend (Vite), and a Docker Compose file for a local PostgreSQL database. The frontend defaults to plain JavaScript (React); TypeScript is optional and can be enabled later if desired.

Prerequisites

- Windows with PowerShell (you already are using this)
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose

Quick start (recommended)

1. Database (you already have Postgres/pgAdmin):

If you already run PostgreSQL and pgAdmin locally, skip any Docker-based DB setup. Ensure a database and user exist matching `backend/.env.example` or set `DATABASE_URL` to your preferred connection string.

Example (psql) to create the database and user if needed:

```powershell
psql -U postgres
CREATE USER cafefausse WITH PASSWORD 'cafefaussepass';
CREATE DATABASE cafefausse_dev OWNER cafefausse;
\q
```

Set the `DATABASE_URL` environment variable before running the backend, for example:

```powershell
set DATABASE_URL=postgresql://cafefausse:cafefaussepass@localhost:5432/cafefausse_dev
```

If you do not have Postgres locally and want a portable DB for development, tell me and I will add a Docker Compose file for Postgres and Adminer.
3. Backend: create virtual environment, install requirements, and run Flask

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# configure DATABASE_URL in backend/.env or use the default in .env.example
# To run the Flask app (development mode):
set FLASK_APP=app
set FLASK_ENV=development
flask run
```

4. Frontend (React + Vite): start the dev server

```powershell
cd frontend
npm install
npm run dev
```

5. Open the frontend at http://localhost:5173 and the backend API at http://127.0.0.1:5000 (API endpoints under `/api`)

Notes

- The frontend is a separate React app (Vite) that communicates with the Flask backend during development. If you later want a single deployable artifact, we can build the frontend and serve the static files from Flask.
- The scaffold is intentionally minimal to get you running quickly. We'll iterate on structure, tests, and CI next.
- If you prefer to run backend in Docker as well, I can add a Dockerfile and update docker-compose.

Files added by scaffold

- `backend/` — Flask app (app factory, models, API blueprint)

Next steps I can take now

- Add Dockerfile for backend and run everything via docker-compose
- Add OpenAPI skeleton and tests for core endpoints
- Wire up migrations and seed data fully

Tell me which next step you want me to do now.