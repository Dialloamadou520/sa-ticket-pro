-- =============================================================================
-- kaypass — Codes promo par collaborateur / ambassadeur
-- L'admin crée un code unique par collaborateur (avec ou sans réduction) pour
-- savoir qui vend le plus de tickets. La réduction s'applique au prix des
-- tickets ; les frais de service ne changent pas.
-- À exécuter dans le SQL Editor de Supabase.
-- =============================================================================

create table if not exists public.promo_codes (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid references public.events (id) on delete cascade,
  code           text not null,
  owner_name     text not null,
  discount_type  text not null default 'percent' check (discount_type in ('percent', 'amount')),
  discount_value integer not null default 0 check (discount_value >= 0),
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Codes uniques sur toute la plateforme : un acheteur saisit juste « AMBA10 ».
create unique index if not exists promo_codes_code_key on public.promo_codes (lower(code));
create index if not exists promo_codes_event_idx on public.promo_codes (event_id);

-- Rattachement du paiement au code utilisé (base des statistiques de vente).
alter table public.payments add column if not exists promo_code_id uuid
  references public.promo_codes (id) on delete set null;
alter table public.payments add column if not exists promo_code text;
alter table public.payments add column if not exists discount integer not null default 0;
create index if not exists payments_promo_code_idx on public.payments (promo_code_id);

alter table public.promo_codes enable row level security;

-- Gestion réservée aux administrateurs. La validation d'un code à l'achat et
-- les statistiques passent par le service-role côté serveur.
drop policy if exists "codes promo: gestion admin" on public.promo_codes;
create policy "codes promo: gestion admin" on public.promo_codes
  for all using (public.is_admin()) with check (public.is_admin());
