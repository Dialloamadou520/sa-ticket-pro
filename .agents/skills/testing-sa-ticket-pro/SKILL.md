---
name: testing-sa-ticket-pro
description: Test Sa Ticket Pro end-to-end locally against the real Supabase DB. Use when verifying event/controller/ticket/scan features or any dashboard UI change.
---

# Testing Sa Ticket Pro

Next.js (App Router, Turbopack) + Supabase (auth, Postgres, RLS). Tested locally on `localhost:3000` against the **real** Supabase project, using isolated seeded data that is deleted afterwards.

## Setup
- Dev server: `npm run dev` (port 3000). Lint/build before PR: `npm run lint && npm run build`.
- Env: `.env.local` holds `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Service role bypasses RLS — use it for seeding/cleanup only.
- After checking out a PR branch, confirm the dev server serves that branch (`git branch --show-current`, `curl -s -o /dev/null -w "%{http_code}" localhost:3000`). Restart `npm run dev` if it was started on another branch.

## Seeding / cleanup (service-role script)
Run scripts from the **repo root** (so `@supabase/supabase-js` resolves) via `node scripts/<file>.mjs`. Parse `.env.local` manually (no dotenv).
Schema gotchas (from `supabase/migrations/0001_init.sql`):
- `organizers` uses `company_name` (NOT `name`/`slug`).
- `tickets.user_id` is NOT NULL — set a buyer id when inserting test tickets.
- `events.status` enum value is `published`; `scans.result` ∈ `valid|already_used|invalid`.
- `profiles` is auto-created on `auth.admin.createUser`; then `update` its `email`/`role`.
Make the seed idempotent: before creating a user, purge any prior test user by email (delete their organizers→events, organizer row, then `auth.admin.deleteUser`). Verify cleanup left 0 test profiles.

## Login flow
Email+password at `/connexion`. Google button is hidden (provider not configured). If a pasted password fails ("Identifiants incorrects"), re-type it manually — masking can hide paste truncation.

## Admin area (`/admin`, `/admin/organisateurs/[id]`)
Layout (`src/app/admin/layout.tsx`) redirects non-admins to `/dashboard`. To test, create a temp profile with `role='admin'` via service role (createUser → update profiles.role='admin'), then delete it after. Admin pages read real platform data (organizers/users/events), so existing prod data populates them. Detail page path is `/admin/organisateurs/<organizer.id>`. After a UI-only PR is merged, prefer testing the deployed prod URL (`https://sa-ticket-pro.vercel.app/admin`) to prove the design is actually live — the same temp admin works since prod uses the same Supabase DB.

## Feature: event controllers (per-event scan access)
- Organizer: **Mes événements** → row action **Contrôleurs** → `/dashboard/evenements/[id]/controleurs` (add/remove by email).
- Controller: logs in with that email → account menu **"Contrôle des entrées"** → `/controle` (lists only assigned events + scanner; manual token entry under "Saisie manuelle du code").
- Security: scanning is authorized server-side only for the ticket's event (`src/app/api/tickets/verify/route.ts`). Adversarial test: scan a ticket from a NON-assigned event → must show "Vous n'êtes pas autorisé à scanner ce ticket."

## Feature: per-controller scan count (PR #16)
- Each scan stores `scanned_by` (user id) + `result` in `scans`. No migration needed to count.
- Count shown on the Contrôleurs page under each email ("N entrées validées"), from `getEventControllerScanCounts` in `src/lib/data/controllers.ts` (joins scans→profiles→email via service role).
- Strong test = prove it's dynamic, not hardcoded: seed N valid scans (assert "N entrées validées"), then perform one live scan via `/controle` as the controller, reload the organizer Contrôleurs page, assert the count is now N+1.
- Counter aggregates only `result='valid'` scans, keyed by lowercased profile email.

## Feature: scanner UI (`/scanner`, `/controle`) — result cards
- Redesign (PR #19) is visual-only; scan logic unchanged. Exercise the 3 result states via **manual entry** (no camera on the VM): valid → green "Entrée autorisée", re-scan same ticket → amber "Déjà utilisé", unknown code → red "Ticket invalide".
- Seed one `status='valid'` ticket with a known hex `qr_token` prefix (e.g. `deadbeef...`); manual entry matches on a hex prefix ≥6 chars (`src/app/api/tickets/verify/route.ts`). An admin (or the ticket's event organizer/controller) can verify any/assigned ticket.
- Order matters: the first valid scan flips the ticket to `used`, so run valid → re-scan (amber) → unknown (red) in that sequence. After submitting, the "Vérifier" button briefly shows "..." (disabled) — wait ~2s and re-screenshot before asserting; the result card may still show the previous state mid-request.
- Camera: clicking "Scanner avec la caméra" on a VM without a camera shows "Aucune caméra détectée sur cet appareil." — the live viewfinder/`animate-scan-line` is NOT testable there; report it as untested.
- Cleanup: delete `scans` for the test ticket, then `tickets` where `qr_token like 'deadbeef%'`, then the temp admin user. Note: `.eq()/.delete()` query builders have no `.catch()` — `await` them directly.

## Recording
Maximize first: `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`. Log in BEFORE starting the recording (setup is not recorded). Annotate with `annotate_recording` (test_start + consolidated assertion per test).

## Devin Secrets Needed
- None beyond what's already in `.env.local` on the box (`SUPABASE_SERVICE_ROLE_KEY`). Applying DB migrations requires the user to run SQL in Supabase SQL Editor, or a `SUPABASE_DB_URL` connection string if automated migration is desired.
