# Sa Ticket Pro

**La billetterie intelligente du Sénégal et de l'Afrique.**

Plateforme SaaS de billetterie événementielle : création et gestion d'événements,
vente de tickets en ligne avec QR code unique, paiements mobiles (Wave, Orange
Money via DexpayAfrica), contrôle des entrées par scan, et panneau d'administration.

## Stack technique

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL, Auth, Row-Level Security)
- **DexpayAfrica** pour les paiements Wave / Orange Money
- **QR codes** (`qrcode`) + **tickets PDF** (`jspdf`)
- Déploiement **Vercel**

## Mode démo

L'application démarre en **mode démonstration** avec des données d'exemple tant
que Supabase n'est pas configuré. Vous pouvez ainsi parcourir l'accueil,
l'explorateur d'événements, les dashboards et le tunnel d'achat sans backend.
Renseignez les variables Supabase pour activer les comptes, la persistance et les
paiements réels.

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseignez vos clés (optionnel pour le mode démo)
npm run dev
```

Ouvrez http://localhost:3000.

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans le SQL Editor, exécutez les migrations puis le seed :
   - `supabase/migrations/0001_init.sql` (tables, enums, RLS, triggers)
   - `supabase/seed.sql` (catégories par défaut)
3. Renseignez dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement)
4. (Auth Google) Activez le provider Google dans Supabase Auth et ajoutez
   l'URL de callback `${NEXT_PUBLIC_SITE_URL}/auth/callback`.

Pour devenir administrateur : passez le `role` d'un profil à `admin` dans la
table `profiles`.

## Paiements (DexpayAfrica)

Renseignez `DEXPAY_API_KEY`, `DEXPAY_WEBHOOK_SECRET` et `DEXPAY_BASE_URL`.
Configurez l'URL de webhook côté Dexpay vers
`${NEXT_PUBLIC_SITE_URL}/api/payments/webhook`. La signature des webhooks est
vérifiée en HMAC SHA-256.

## Structure

```
src/
  app/              # Routes (App Router)
    api/            # Route handlers (paiements, vérification tickets)
    dashboard/      # Espace organisateur
    admin/          # Administration plateforme
    evenements/     # Détails + achat
  components/       # UI, layout, événements, dashboard, tickets, auth...
  lib/
    data/           # Accès données (Supabase + fallback démo)
    supabase/       # Clients browser/server/admin
    payments/       # Intégration DexpayAfrica
supabase/
  migrations/       # Schéma SQL + RLS
  seed.sql          # Données initiales
```

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run lint` — ESLint

## Déploiement Vercel

1. Importez le dépôt sur Vercel.
2. Ajoutez les variables d'environnement (voir `.env.example`).
3. Déployez. `NEXT_PUBLIC_SITE_URL` doit pointer vers l'URL de production.
