# TODO — Interactive WebApp Assignment

This file mirrors the tracked todo list stored for the project. The agent will update the programmatic todo store as work progresses.

1. [x] Project kickoff & SRS review — completed
   - Review SRS and capture high-level goals and acceptance criteria.

2. [x] Choose tech stack & architecture — completed
   - React (Vite) frontend, Flask backend, PostgreSQL (local-first), migrations deferred.

3. [x] Create project scaffold (backend + frontend) — completed
   - Flask app factory, models, API blueprint; Vite + React stub; cleaned unused artifacts.

4. [ ] Add init DB / seed script — not started
   - Create `scripts/init_db.py` to run `create_all()` and insert sample data.

5. [ ] Harden backend validation (checkout endpoint) — not started
   - Validate `POST /api/cart/checkout` payloads and return clear 400s on bad input.

6. [ ] Implement frontend UI per wireframes — not started
   - Build Menu, Item Detail, Cart, Checkout/Reservation pages.

7. [ ] Add basic tests (backend + frontend) — not started
   - Unit tests for API; e2e happy path for checkout.

8. [ ] Add simple admin auth & admin dashboard — not started
   - Dev-only secret/password; admin UI per wireframes.

9. [ ] CI / lint / formatting — not started
   - Add GitHub Actions or local scripts to run tests and linters.

10. [~] Prepare minimal deployment / run instructions — in-progress
   - `README.md` updated for local Postgres; may finalize run scripts.

11. [ ] User testing & iteration — not started
   - Collect feedback and iterate on UX.

---

How to use this file:
- The agent keeps a programmatic copy of the todo list and will update it when tasks change.
- To keep things in sync with your workflow, consider creating GitHub issues from these items or committing this `TODO.md` so it appears in the repo.

