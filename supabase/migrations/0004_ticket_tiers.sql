-- Catégories de tickets par événement (Standard, VIP, VVIP…), chacune avec son
-- prix et son quota. Rétrocompatible : un événement sans catégorie continue
-- d'utiliser son `price`/`ticket_type` uniques comme catégorie par défaut.

create table if not exists public.ticket_tiers (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  name       text not null,
  price      integer not null default 0 check (price >= 0),
  capacity   integer not null default 0 check (capacity >= 0), -- 0 = illimité
  sold       integer not null default 0 check (sold >= 0),
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ticket_tiers_event_idx on public.ticket_tiers (event_id);

-- Lien catégorie -> paiement / ticket (nullable pour l'existant).
alter table public.payments add column if not exists tier_id uuid
  references public.ticket_tiers (id) on delete set null;
alter table public.payments add column if not exists tier_name text;
alter table public.tickets add column if not exists tier_id uuid
  references public.ticket_tiers (id) on delete set null;
alter table public.tickets add column if not exists tier_name text;

-- RLS : lecture publique des catégories (non sensibles). Les écritures passent
-- par le client service-role côté serveur (après contrôle de propriété).
alter table public.ticket_tiers enable row level security;

drop policy if exists "catégories ticket: lecture publique" on public.ticket_tiers;
create policy "catégories ticket: lecture publique" on public.ticket_tiers
  for select using (true);

drop policy if exists "catégories ticket: gestion propriétaire" on public.ticket_tiers;
create policy "catégories ticket: gestion propriétaire" on public.ticket_tiers
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.events e
      join public.organizers o on o.id = e.organizer_id
      where e.id = ticket_tiers.event_id and o.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.events e
      join public.organizers o on o.id = e.organizer_id
      where e.id = ticket_tiers.event_id and o.user_id = auth.uid()
    )
  );
