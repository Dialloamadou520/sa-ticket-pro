# Test Report — DexPay Paid Checkout Flow (PR #1)

**Result: PASSED (2/2).** A real bug was found and fixed during testing.

## What changed
The Dexpay integration was rewritten to the real DEXCHANGE PAY API (`POST /checkout-sessions`, header `x-api-key`, hosted checkout redirect). This test proves a paid purchase creates a real checkout session and redirects the buyer to the live DexPay hosted page.

## Escalations / notes
- **Bug found & fixed:** `payments` had no RLS `UPDATE` policy, so the user-scoped client's `update({provider_reference})` (and `status`) silently affected 0 rows → `provider_reference` stayed null. Fixed by routing server-controlled payment mutations through the service-role (admin) client. After fix, `provider_reference` persists.
- **Local limitation (not a bug):** DexPay rejects non-public URLs (`localhost`) with HTTP 422 (`success_url must be a URL address`). Verified by curl: `localhost` → 422, public https URL → 201. For the browser test I temporarily set `NEXT_PUBLIC_SITE_URL` to a public URL. In production (Vercel domain) this is a non-issue. Documented in `.env.example`.
- **Out of scope (untested by design):** completing a real mobile-money payment (LIVE production key = real money) and webhook → ticket generation (needs public URL + completed payment). Stopped at the hosted checkout page.

## Tests

| Test | Result |
|---|---|
| Paid purchase creates a DexPay checkout session & redirects to hosted page | ✅ Passed |
| Payment record persisted with `provider_reference` (DB) | ✅ Passed (after fix) |

### Evidence

| 🟢 DexPay hosted checkout — Step 1 (country) | 🟢 DexPay hosted checkout — Step 2 (methods) |
|---|---|
| ![DexPay step 1](https://app.devin.ai/attachments/784218d3-9e2b-4985-bd59-1b89f1b19081/evidence_dexpay_step1.png) | ![DexPay step 2](https://app.devin.ai/attachments/b8aa4577-a257-405c-9075-72c5f38b8f9e/evidence_dexpay_step2.png) |
| `checkout.dexpay.africa/checkout/<ref>` — 5,000 XOF, item "1 ticket(s) — Match de Gala - Lions de la Teranga" | Wave / Orange Money / Mixx By Yas available for Sénégal, 5,000 XOF |

**DB after fix** (`payments` row for session `59db4f23-…`):
```
amount=5000, provider=wave, status=pending, quantity=1,
provider_reference=59db4f23-b779-4a73-958e-c0576fcb6ea9   (non-null ✓)
```

| 🔴 Before fix / localhost limitation (HTTP 422) |
|---|
| ![422 localhost](https://app.devin.ai/attachments/15c878c9-8cff-43b7-ae41-5d07c250a0dd/evidence_422_localhost.png) |
| DexPay 422 when `success_url/webhook_url` use `localhost` (no public domain) |
