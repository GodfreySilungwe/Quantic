Tech decision and architecture rationale for "Cafe Fausse" interactive web app

Overview

This document captures the chosen stack for the frontend, backend, database, hosting, and related services for the Cafe Fausse interactive web app MVP, plus rationale, tradeoffs, and an estimated implementation effort for the MVP.

Chosen stack (MVP-first)

- Frontend
  - Framework: React (JavaScript) — TypeScript optional
  - Bundler: Vite (fast dev server & build)
  - Styling: Tailwind CSS (recommended) or plain CSS modules for simplicity
  - Rationale: We'll use a React frontend served via the Vite dev server during local development. The frontend will communicate with the Flask backend over JSON APIs on localhost (CORS handled by the backend during dev).

- Backend (chosen)
  - Runtime: Python 3.10+
  - Framework: Flask (Blueprints + Flask extensions)
  - API design: RESTful endpoints; OpenAPI documentation via `flask-smorest` or `flask-restx`
  - ORM & Migrations: SQLAlchemy + Alembic (or Flask-Migrate as a thin wrapper)
  - Serialization/Validation: Marshmallow (or use Pydantic models if preferred)
  - Auth: JWT (PyJWT) for API tokens; session cookies for admin UI as needed
  - Testing: pytest + pytest-flask, requests for integration tests
  - Rationale: Flask is lightweight, easy to learn, and flexible for assignment constraints; the Python ecosystem integrates well with PostgreSQL and common deployment options.

- Database
  - Primary: PostgreSQL (managed for production — e.g., Render/Azure/Heroku)
  - Local/dev: Local Postgres (you already have Postgres/pgAdmin installed). Docker Compose is optional and not required for this assignment. Optionally use SQLite for very small local tests.
  - Migration tooling: Deferred for initial MVP. We'll use SQLAlchemy's `create_all()` or simple seed scripts during early development and add Alembic/Flask-Migrate once the schema stabilizes.
  - Rationale: Relational model fits menu, orders, reservations, and reporting. SQLAlchemy provides mature ORM and query flexibility.

- Caching / ephemeral store
  - Redis (optional) for sessions, caching menu lookups, and locking for concurrent availability/reservations.

-- Hosting (local-first for the assignment)
  - Local-first: everything will be hosted locally for development and demonstration using Docker Compose (Postgres + backend) and the Vite dev server for frontend.
  - Cloud hosting (Vercel/Netlify/Render) is optional later if you want a public demo, but it's not required for the assignment deliverable.
  - Devops/CI: Optional GitHub Actions if you want automated checks — deferred until after local confirmation.

- Observability and errors
  - Logging: python `logging` with JSON output (or structlog)
  - Error tracking: Sentry (optional)
  - Metrics: Prometheus + Grafana (optional for production)

- Local dev / reproducibility
  - Docker Compose for Postgres/Redis and backend (optional) + frontend dev server
  - Seed scripts for sample menu and test users

Security & Auth

- MVP: Allow anonymous checkout with name/phone/email for confirmation OR require simple email verification. Admin UI protected by JWT or password-based auth.
- Payment: For assignment/demo, mock payments or use Stripe test mode if card payments required.
- Sensitive configuration stored in environment variables and secret store of host provider.

API contract summary (high-level)

- GET /api/menu — list categories and items
- GET /api/menu/{id} — item details
- POST /api/cart/checkout — submit order (body: items, contact, pickup/delivery/reservation)
- GET /api/orders/{id} — order status
- Admin endpoints: CRUD for menu, orders list, update order status

Data model (high level)

- User (optional): id, name, email, phone, role
- MenuItem: id, name, description, price_cents, available, category_id, prep_time_minutes
- Category: id, name, position
- Order: id, user_contact (name/email/phone), items [{menu_item_id, qty, price}], total_cents, status, type (pickup/delivery/reservation), created_at
- Reservation (if separate): id, name, party_size, datetime, notes, status

Estimated effort (MVP — browse menu + cart + submit order)

- Scoping & wireframes: 1-2 days
- Repo & scaffolding: 1 day
- Backend API & DB + seeds: 3-6 days (Python/Flask; migrations deferred — use create_all/seed for MVP)
- Frontend UI (menu, item, cart, checkout): 4-6 days
- Tests & CI: 2-3 days
- Deploy & polish: 1-2 days
- Total (MVP): ~12-20 working days (one developer)

Tradeoffs & alternatives

- Use Django if you want faster admin scaffolding and a batteries-included framework; Django provides an admin UI and ORM out of the box.
- Use a serverless approach (Firebase) if you want to avoid backend ops; tradeoffs include less control over transactions.

Contract & success criteria for this task

- Inputs: SRS document and any non-functional constraints (deadline, hosting preference)
- Outputs: `tech_decision.md` (this file) and an architecture diagram `architecture.svg`.
- Success: You confirm stack choices (React + Flask + Postgres) or request changes; the team can start scaffolding within 1 day.

-Next steps (I can take immediately)

 - Initialize a repository scaffold with a local-first setup:
  - `frontend/` — React + Vite (JavaScript by default; TypeScript optional) + Tailwind (optional)
  - `backend/` — Flask app with Blueprints, SQLAlchemy models, Flask-Migrate, and a small OpenAPI schema via `flask-smorest` or `flask-restx`
  - Frontend served by Vite dev server (http://localhost:5173) communicating with backend API (http://localhost:5000)
  - (Optional) Docker Compose can be added if you prefer a portable Postgres + Adminer setup; the project assumes you already run Postgres locally.
  - `README.md` — how to run frontend and backend locally using PowerShell on Windows
- Produce an OpenAPI skeleton for the backend endpoints and a minimal set of database migrations with seed data.
- Create low-fidelity wireframes for the main user flows.

If you want other specifics (use Django, require Stripe payments, or a particular hosting target), tell me and I'll update the plan and diagram.