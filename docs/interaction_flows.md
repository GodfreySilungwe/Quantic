Interaction flows and acceptance criteria — Cafe Fausse

Overview

These flows cover the main user journeys for the MVP: browsing the menu, placing an order (pickup or reservation), and admin order/menu management. Each flow lists steps, UI screens (wireframe filenames), data exchanged with the backend, and acceptance criteria.

1) Browse -> Add to Cart -> Checkout (Order)

- Entry: User opens frontend at http://localhost:5173 (wireframe: `wireframes/menu.svg`).
- Steps:
  1. User selects a category (Menu screen) — frontend requests `GET /api/menu` to populate categories & items.
  2. User clicks "Add" on an item (Menu or Item Detail) — adds item to local cart state.
  3. User opens Cart (wireframe: `wireframes/cart.svg`) to review items.
  4. User clicks Checkout -> taken to Checkout/Reservation form (`wireframes/checkout_reservation.svg`).
  5. User fills contact details and selects pickup or reservation datetime. Clicks Place Order.
  6. Frontend POSTs to `POST /api/cart/checkout` with payload {items: [{menu_item_id, qty}], customer_name, customer_email, customer_phone, type, datetime}
  7. Backend validates, creates Order + OrderItems, returns {order_id, status}.
  8. Frontend shows confirmation page/modal with order ID and status.

- Data exchanged: `GET /api/menu`, `POST /api/cart/checkout`, optional `GET /api/orders/{id}` to poll status.
- Edge cases / validation:
  - Empty cart -> show validation message, prevent checkout.
  - Invalid contact -> show inline validation.
  - Item unavailable at checkout -> show error and remove/adjust item.
- Acceptance criteria (happy path):
  - User can browse items, add items to cart, submit contact & pickup/reservation info, and receive an order confirmation (order id + pending status).

2) Reservation-only (same flow as checkout but order type "reservation")

- Steps: Use Checkout flow; `type` is "reservation" and DTO includes party_size and datetime.
- Acceptance: Reservation record created and returned with id and status.

3) Admin: View and update orders; manage menu

- Entry: Admin signs in via simple admin UI (out of scope for MVP login; can be protected by a secret token or simple password for dev).
- Steps:
  1. Admin requests `GET /api/admin/orders` (or `/api/orders` with admin flag) -> receives order list with items and statuses.
  2. Admin clicks an order -> can change status (pending -> in-progress -> ready -> completed).
  3. Admin manages menu via `GET/POST/PUT/DELETE /api/admin/menu` endpoints.
- Acceptance criteria:
  - Admin can change order status and the change is persisted and visible in subsequent requests.

Notes and UI contracts

- API paths are lightweight and JSON-based. The frontend will handle CORS for local dev (Flask may enable CORS in dev environment).
- Keep the frontend stateless regarding orders (backend is source of truth). Use local storage for cart only as an optional convenience.

Next steps after you review

- I can create a simple clickable prototype (HTML pages that open the SVGs) for quick review.
- I can convert the wireframe SVGs to PNGs and add them to a short presentation if you need to hand them off.
- I can start implementing the frontend pages/components to match these flows (Todo 7).

Files created in this step

- `wireframes/menu.svg`
- `wireframes/item_detail.svg`
- `wireframes/cart.svg`
- `wireframes/checkout_reservation.svg`
- `wireframes/admin_dashboard.svg`
- `docs/interaction_flows.md`
