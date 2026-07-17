-- =============================================================================
-- Statistiques de fréquentation : enregistre chaque visite de page (« clic »)
-- de la plateforme pour l'administration (total, par jour, pages populaires,
-- visiteurs uniques). Insertion publique (anonyme), lecture réservée aux admins.
-- =============================================================================

create table if not exists public.page_views (
  id         uuid primary key default gen_random_uuid(),
  path       text not null,
  event_id   uuid references public.events (id) on delete set null,
  visitor_id text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on public.page_views (created_at);
create index if not exists page_views_path_idx on public.page_views (path);
create index if not exists page_views_event_idx on public.page_views (event_id);

alter table public.page_views enable row level security;

-- Insertion ouverte : les visites sont enregistrées côté serveur pour tout
-- visiteur (connecté ou non).
drop policy if exists "page_views: insertion publique" on public.page_views;
create policy "page_views: insertion publique" on public.page_views
  for insert with check (true);

-- Lecture réservée aux administrateurs.
drop policy if exists "page_views: lecture admin" on public.page_views;
create policy "page_views: lecture admin" on public.page_views
  for select using (public.is_admin());
