-- =============================================================================
-- kaypass — Co-organisateurs d'événement
-- Un organisateur propriétaire peut ajouter des « co-organisateurs » (par email)
-- à son événement. Un co-organisateur peut gérer l'événement (modifier,
-- participants, contrôleurs) mais n'a PAS accès aux revenus du propriétaire.
-- À exécuter dans le SQL Editor de Supabase.
-- =============================================================================

create table if not exists public.event_collaborators (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);
create index if not exists event_collaborators_event_idx on public.event_collaborators (event_id);
create index if not exists event_collaborators_email_idx on public.event_collaborators (lower(email));

alter table public.event_collaborators enable row level security;

-- Gestion réservée à l'organisateur propriétaire de l'événement (ou admin).
drop policy if exists "co-organisateurs: gestion propriétaire" on public.event_collaborators;
create policy "co-organisateurs: gestion propriétaire" on public.event_collaborators
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

-- Un co-organisateur peut lire ses propres assignations (correspondance par email).
drop policy if exists "co-organisateurs: lecture propre" on public.event_collaborators;
create policy "co-organisateurs: lecture propre" on public.event_collaborators
  for select using (
    lower(email) = lower(coalesce(
      (select p.email from public.profiles p where p.id = auth.uid()),
      ''
    ))
  );
