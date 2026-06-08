# Test Plan — Paid DexPay Checkout Flow (PR #1)

## What changed
The Dexpay integration was rewritten to match the **real** DEXCHANGE PAY API:
- `POST https://api.dexpay.africa/api/v1/checkout-sessions` with header `x-api-key` (public key)
- Hosted checkout: redirect the buyer to the returned `payment_url`
- Webhook `checkout.completed`, signature header `x-dexchange-signature` (HMAC-SHA256 over `JSON.stringify(payload)`)
- Env vars: `DEXPAY_PUBLIC_KEY`, `DEXPAY_SECRET_KEY`, `DEXPAY_BASE_URL`

**Old behavior:** paid purchase always returned 503 "Paiement mobile non configuré" (no keys / wrong endpoint+auth).
**New behavior:** paid purchase creates a real checkout session and redirects to `https://dexpay.africa/checkout/<reference>`.

## Constraint (important)
The provided key is a **LIVE production** key (`isSandbox:false`) → completing a payment moves **real money**. I will **NOT** complete a real mobile-money payment. The test stops at the DexPay hosted checkout page load. Webhook → ticket generation requires a public URL (only works once deployed) and a completed real payment, so it is **out of scope** here and will be marked untested.

## Environment (PRODUCTION)
- Live production: `https://sa-ticket-pro.vercel.app` — confirmed REAL mode (env vars set on Vercel, probe returns `401 Connexion requise`, not `demo:true`).
- `NEXT_PUBLIC_SITE_URL = https://sa-ticket-pro.vercel.app` (public domain → DexPay no longer rejects URLs as it did with localhost).
- Logged in as `amadoudiallo8345@gmail.com` (admin).
- Paid event used: **Match de Gala - Lions de la Teranga** (`match-gala-teranga`, 5 000 FCFA).

---

## Test 1 — Paid purchase creates a checkout session and redirects to DexPay
**Steps**
1. Navigate to `https://sa-ticket-pro.vercel.app/evenements/match-gala-teranga/achat`.
2. Quantity = 1. Enter "Nom du participant" = `Amadou Diallo`, phone = `+221770000000`.
3. Payment method selector should be visible (Wave / Orange Money). Leave **Wave** selected.
4. Button should read **"Payer 5 000 FCFA"**. Click it.

**Pass criteria**
- Button shows "Traitement..." then the browser **navigates away from sa-ticket-pro.vercel.app** to a DexPay hosted URL of the form `https://checkout.dexpay.africa/checkout/<reference>`.
- The DexPay hosted checkout page loads and shows the amount **5 000 FCFA** (and/or the item label "1 ticket(s) — Match de Gala - Lions de la Teranga") and operator options.

**Fail criteria (would happen if broken)**
- A red toast "Paiement mobile non configuré" appears (means key not detected / 503).
- A red toast "Échec création session DexPay : 4xx/5xx" (means wrong endpoint/auth/payload).
- Stays on localhost with no navigation.

> Distinguishing power: if the integration were still the old/broken version, it would 503 and toast an error instead of navigating to a real DexPay checkout page. A broken payload/auth would surface the DexPay error text in the toast.

---

## Test 2 — Payment record persisted with provider_reference (DB assertion)
After Test 1, query Supabase:
```sql
select id, amount, provider, status, provider_reference, quantity
from public.payments
where event_id = (select id from public.events where slug='match-gala-teranga')
order by created_at desc limit 1;
```
**Pass criteria**
- One row: `amount = 5000`, `provider = wave`, `status = pending`, `quantity = 1`, and `provider_reference` is **non-null** (the DexPay session reference = the payment `id`).

**Fail criteria**
- No row, or `provider_reference` is null (means createDexpayCheckout failed before update).

---

## Out of scope / untested
- Actual mobile-money payment completion (real money, live key) — untested by design.
- Webhook `checkout.completed` → ticket generation — requires public URL + completed payment; untested locally. (Signature verification logic verified by unit-level reasoning only.)
