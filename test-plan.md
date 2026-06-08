# Test Plan — Sa Ticket Pro (PR #1, mode démo)

Running locally at http://localhost:3000 in **demo mode** (Supabase not configured). All flows use sample data (`src/lib/sample-data.ts`).

## Primary flow: Buy a ticket → get QR ticket + PDF

| # | Action | Pass criteria (concrete) |
|---|--------|--------------------------|
| 1 | Load `/` | Hero text "Vendez et achetez vos tickets, en toute simplicité." + stats "500+ / 50 000+ / 120+" + search bar visible |
| 2 | Click "Explorer les événements" | URL = `/explorer`; grid shows ≥6 event cards with price/date/location |
| 3 | In Explorer, click a category pill (e.g. "Concerts") | URL gains `?category=concerts`; grid filters to only matching events (count changes, not all 6) |
| 4 | Click an event card | URL = `/evenements/<slug>`; detail page shows title, date/time, location, a price, and an "Acheter un ticket" button |
| 5 | Click "Acheter un ticket" | URL = `/evenements/<slug>/achat`; PurchaseForm shows Quantité=1, Nom field, Wave/Orange Money selector, Total = ticket price |
| 6 | Click the quantity "+" once | Quantity displays "2"; Total doubles (= 2× price), button label updates to `Payer <2×price>` |
| 7 | Type a name (e.g. "Awa Ndiaye"), keep Wave selected, click "Payer ..." | Redirects to `/paiement/confirmation?demo=1...`; heading "Paiement confirmé 🎉" + "(Aperçu de démonstration)"; **2** TicketView cards rendered (matches qty=2) |
| 8 | Inspect a ticket card | Each card shows event title, holder "Awa Ndiaye", ticket type, and a **rendered QR code image** (not a broken/empty box) |
| 9 | Click "Télécharger PDF" on a ticket | A PDF file downloads (verify file appears in ~/Downloads, non-zero size); no JS error toast |

If QR generation were broken, step 8 shows an empty/placeholder box. If PDF (jsPDF) were broken, step 9 produces no file / console error.

## Secondary: Scanner + Organizer dashboard + Admin (render + UX)

| # | Action | Pass criteria |
|---|--------|---------------|
| 10 | Go to `/scanner`, enter any token in the manual field, submit | Result card shows green "valide" state (demo returns `valid`). *Note: demo-canned, labeled as such.* |
| 11 | Go to `/dashboard` | Amber demo banner present; 4 stat cards (Événements/Publiés/Tickets vendus/Revenus) with non-zero values; "Événements récents" list populated |
| 12 | Go to `/dashboard/evenements`, click "Nouveau" → fill title+lieu+date → submit | Toast error "Mode démo : configurez Supabase..." (writes correctly blocked in demo) — proves Server Action wiring |
| 13 | Go to `/admin` | 4 stat cards incl. "Commissions (10%)"; "Événements en attente de validation" section with ≥1 event + Approuver/Refuser buttons |

## Out of scope (no backend in demo mode)
- Real auth / Google OAuth, real payment via Dexpay, real ticket persistence & scan invalidation, RLS. These require Supabase keys (pending from user).
