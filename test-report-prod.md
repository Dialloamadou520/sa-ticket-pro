# Test Report — DexPay Paid Flow on LIVE Production

**Result: PASSED (2/2)** on `https://sa-ticket-pro.vercel.app` (real Supabase + LIVE DexPay key).

## Context / what was fixed to get here
Production was running in **demo mode** because **no environment variables were set on Vercel**. Fixed by adding the 7 vars (Production scope) and redeploying with `--force` (the build cache was reusing the old, empty `NEXT_PUBLIC_*` values). Verified real mode via probe: `POST /api/tickets/verify` now returns `401 Connexion requise` instead of `{"demo":true}`.

## Tests

| Test | Result |
|---|---|
| Paid purchase on prod creates a real DexPay checkout session & redirects to hosted page | ✅ Passed |
| Payment record persisted with `provider_reference` (DB) | ✅ Passed |

### Evidence

| 🟢 Prod /achat (real mode) | 🟢 Real DexPay hosted checkout |
|---|---|
| ![prod achat](https://app.devin.ai/attachments/f64f16bc-9533-4692-9833-05ca7daf7bfc/prod_achat.png) | ![prod dexpay](https://app.devin.ai/attachments/9660d54d-f5b5-4e33-972e-d930657110ce/prod_dexpay.png) |
| Real event from Supabase, 5 000 FCFA, Wave selected | `checkout.dexpay.africa/checkout/048741f0-…` — 5,000 XOF, "1 ticket(s) — Match de Gala", Wave/Orange Money/Mixx |

**DB row** (`payments`, newest for the event):
```
id                 = 048741f0-aedc-4466-a7aa-3293f5bc7f6c
amount             = 5000
provider           = wave
status             = pending
quantity           = 1
provider_reference = 048741f0-aedc-4466-a7aa-3293f5bc7f6c   (non-null ✓, == checkout ref)
```

## Constraint respected
LIVE production DexPay key → completing the payment would move real money. **Stopped at the hosted checkout page** (did not pay).

## Out of scope / untested
- Real mobile-money payment completion (real money) — untested by design.
- Webhook `checkout.completed` → ticket generation — needs a completed real payment; not exercised. The webhook endpoint is public at `https://sa-ticket-pro.vercel.app/api/payments/webhook` (configure this URL in the DexPay portal).
