-- =============================================================================
-- kaypass — Corbeille des événements supprimés
-- Avant chaque suppression par l'administrateur, l'événement et toutes ses
-- données liées (catégories, paiements, tickets, scans, contrôleurs,
-- co-organisateurs, codes promo) sont archivés ici sous forme de snapshot JSON.
-- L'administrateur peut ensuite restaurer l'événement ou le purger.
-- À exécuter dans le SQL Editor de Supabase.
-- =============================================================================

create table if not exists public.deleted_events (
  id             uuid primary key,
  title          text not null,
  organizer_id   uuid,
  organizer_name text,
  starts_at      timestamptz,
  tickets_sold   integer not null default 0,
  snapshot       jsonb not null,
  deleted_at     timestamptz not null default now(),
  deleted_by     uuid references public.profiles (id) on delete set null
);
create index if not exists deleted_events_deleted_at_idx
  on public.deleted_events (deleted_at desc);

alter table public.deleted_events enable row level security;

-- Corbeille strictement réservée aux administrateurs.
drop policy if exists "corbeille: admin uniquement" on public.deleted_events;
create policy "corbeille: admin uniquement" on public.deleted_events
  for all using (public.is_admin()) with check (public.is_admin());
