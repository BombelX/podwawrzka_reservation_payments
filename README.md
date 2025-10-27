# Podwawrzka Reservation & Payments

End-to-end booking plugin powering the Podwawrzka short-stay apartments website. The project couples a headless WordPress integration with a Przelewy24-backed payment workflow and a bespoke availability calendar, giving guests an experience that feels like Booking.com but fully tailored to Podwawrzka.

## Features
- Custom reservation calendar optimised for short-term stays and partial-day blocks.
- Seamless Przelewy24 payment flow with webhook-ready status updates.
- Headless architecture: WordPress serves as the CMS shell, while this repo delivers the booking UI and API.
- Auto-generated Swagger docs for every backend endpoint.
- SQLite + Drizzle ORM for lightweight persistence and easy migration management.

## Tech Stack
- Backend: Express 5, TypeScript, Drizzle ORM, SQLite, Swagger
- Frontend: Next.js 15 (Turbopack), React 19, TailwindCSS 4, DaisyUI, `cally` calendar library
- Infrastructure integrations: Przelewy24 API, WordPress (REST bridge/shortcode)

## Repository Layout

| Path | Description |
| --- | --- |
| `backend/` | Express API, database models, Swagger spec, Przelewy24 integration hooks |
| `backend/src/routes/` | Reservation and payment endpoints (`/reservations/already`, `POST /payments/...`, etc.) |
| `backend/src/db/` | Drizzle schema (`schema.ts`) and SQLite adapter (`client.ts`) |
| `frontend/` | Next.js booking widget rendered inside the WordPress plugin |
| `frontend/src/app/components/calendar.tsx` | Reusable calendar component wired to reservation availability |
| `frontend/public/` | Static assets bundled with the widget |

## Quick Start

> Prerequisites: Node.js 20+, npm 10+, Git, WordPress instance (for plugin embedding), Przelewy24 sandbox credentials.

1. Clone the repository:
	```powershell
	git clone https://github.com/BombelX/podwawrzka_reservation_payments.git
	cd podwawrzka_reservation_payments
	```
2. Install dependencies for both workspaces:
	```powershell
	cd backend
	npm install
	cd ..\frontend
	npm install
	cd ..
	```
3. Configure environment files (see below).
4. Run the backend API:
	```powershell
	cd backend
	npm run dev
	```
	The API starts on `http://localhost:3000`, seeds a few sample reservations, and exposes docs under `/swagger`.
5. In a new terminal, run the booking widget frontend:
	```powershell
	cd frontend
	npm run dev
	```
	Visit `http://localhost:3001` (or whichever port Next.js selects) to test the widget.

## Configuration

Create a `.env` file inside `backend/`:

```dotenv
PORT=3000
DATABASE_URL=./data/app.db
P24_MERCHANT_ID=""
P24_POS_ID=""
P24_API_KEY=""
P24_CRC=""
P24_SANDBOX=true
WORDPRESS_ALLOWED_ORIGINS=https://podwawrzka.pl
```

- `DATABASE_URL` keeps SQLite next to the codebase for local development.
- `P24_*` credentials come from the Przelewy24 merchant panel; use sandbox keys while testing payments.
- `WORDPRESS_ALLOWED_ORIGINS` is enforced by CORS to accept requests from the production site only.

For the frontend create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Podwawrzka Apartments
NEXT_PUBLIC_CALENDAR_DEFAULT_VIEW=two-month
```

## API Overview

- `GET /reservations/already?month=7&year=2025` – returns reservations intersecting the given month, powering the availability calendar.
- `POST /payments/checkout` – (planned) initiates a Przelewy24 transaction and returns the redirect URL.
- `POST /payments/webhook` – (planned) receives status confirmations from Przelewy24 and updates the `payments` table.
- `GET /swagger` – view the OpenAPI spec and try the endpoints.

Each handler validates input with Zod and leverages Drizzle ORM models declared in `backend/src/db/schema.ts`. When the server boots it seeds sample reservations into `/data/app.db` for easier local testing.

## WordPress Integration

1. Deploy the backend API to a secure host (e.g., VPS, Render, Fly.io) and configure HTTPS.
2. Build the frontend widget and expose it as static assets or an embeddable bundle:
	```powershell
	cd frontend
	npm run build
	```
3. Wrap the compiled frontend inside a WordPress plugin:
	- Enqueue the widget script on the desired page.
	- Register a shortcode (e.g., `[podwawrzka-reservation]`) that renders a `<div id="podwawrzka-widget"></div>` container.
	- Mount the React app to that container at runtime.
4. Configure the plugin to read the WordPress REST API nonce (if needed) and forward authenticated requests to the Express backend via `NEXT_PUBLIC_API_URL`.
5. For payments, redirect guests to the Przelewy24 hosted payment page and use the webhook endpoint to mark reservations as paid before confirming them inside WordPress.

## Database & Migrations

Drizzle manages the schema. To create and run migrations:

```powershell
cd backend
npx drizzle-kit generate:sqlite
npx drizzle-kit push:sqlite
```

`backend/drizzle/` stores the generated SQL files and the migration journal.

## Testing Checklist
- [ ] Reservation creation rejects overlapping intervals.
- [ ] Calendar blocks already-booked dates and enforces arrival/departure rules.
- [ ] Przelewy24 sandbox transaction completes and updates `payments.status`.
- [ ] WordPress shortcode renders the widget and exchanges data securely over HTTPS.

## Roadmap
- Implement end-to-end payment flow (checkout + webhook confirmation).
- Add authentication for property managers (booking approvals, manual overrides).
- Extend the calendar to support multi-room inventory and seasonal pricing.
- Automate CI checks and preview deployments for both backend and frontend.

---

Have ideas or found a bug? Open an issue or start a discussion — every improvement helps travellers book Podwawrzka stays faster.

