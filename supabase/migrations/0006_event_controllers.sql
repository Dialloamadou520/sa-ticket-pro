-- =============================================================================
-- Sa Ticket Pro — Contrôleurs d'événement
-- Un organisateur peut ajouter des « contrôleurs » (par email) à un événement.
-- Le seul rôle d'un contrôleur est de scanner les tickets de cet événement.
-- À exécuter dans le SQL Editor de Supabase.
-- =============================================================================

create table if not exists public.event_controllers (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);
create index if not exists event_controllers_event_idx on public.event_controllers (event_id);
create index if not exists event_controllers_email_idx on public.event_controllers (lower(email));

alter table public.event_controllers enable row level security;

-- Gestion réservée à l'organisateur propriétaire de l'événement (ou admin).
drop policy if exists "contrôleurs: gestion organisateur" on public.event_controllers;
create policy "contrôleurs: gestion organisateur" on public.event_controllers
  for all using (
    public.is_admin()
    or event_id in (
      select e.id from public.events e
      join public.organizers o on o.id = e.organizer_id
      where o.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or event_id in (
      select e.id from public.events e
      join public.organizers o on o.id = e.organizer_id
      where o.user_id = auth.uid()
    )
  );

-- Un contrôleur peut lire ses propres assignations (correspondance par email).
drop policy if exists "contrôleurs: lecture propre" on public.event_controllers;
create policy "contrôleurs: lecture propre" on public.event_controllers
  for select using (
    lower(email) = lower(coalesce(
      (select p.email from public.profiles p where p.id = auth.uid()),
      ''
    ))
  );
