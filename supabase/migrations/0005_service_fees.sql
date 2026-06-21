-- Frais de service configurables.
--   * Interrupteur global (réglage admin) dans `app_settings` (table singleton).
--   * Mode par événement : barème fixe (`service_fee`), commission 1,5 %
--     (`commission`) ou aucun frais (`none`).
-- Les frais sont payés par l'acheteur (inclus dans le montant débité) ; le
-- montant collecté est enregistré sur le paiement pour audit.

-- Réglages globaux (une seule ligne).
create table if not exists public.app_settings (
  id                   boolean primary key default true check (id),
  service_fees_enabled boolean not null default true,
  updated_at           timestamptz not null default now()
);
insert into public.app_settings (id) values (true) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

-- Lecture publique (non sensible : nécessaire pour afficher le total à l'achat).
drop policy if exists "réglages: lecture publique" on public.app_settings;
create policy "réglages: lecture publique" on public.app_settings
  for select using (true);

-- Écriture réservée aux administrateurs.
drop policy if exists "réglages: écriture admin" on public.app_settings;
create policy "réglages: écriture admin" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Mode de frais par événement.
alter table public.events add column if not exists fee_mode text not null
  default 'service_fee'
  check (fee_mode in ('service_fee', 'commission', 'none'));

-- Frais de service réellement collectés sur un paiement (audit / reporting).
alter table public.payments add column if not exists service_fee integer
  not null default 0 check (service_fee >= 0);
