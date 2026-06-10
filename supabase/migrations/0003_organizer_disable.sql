-- =============================================================================
-- Sa Ticket Pro — Désactivation d'organisateur (soft-delete)
-- Permet à l'admin de « retirer » un organisateur sans supprimer ses données :
-- l'organisateur est marqué désactivé et ses événements ne sont plus publics.
-- Idempotent — réexécutable sans erreur.
-- =============================================================================

-- Colonne de désactivation (soft-delete) sur les organisateurs.
alter table public.organizers
  add column if not exists disabled boolean not null default false;

-- Les événements d'un organisateur désactivé ne doivent plus être visibles
-- publiquement : on étend la lecture publiée pour exclure ces organisateurs.
drop policy if exists "événements: lecture publiée" on public.events;
create policy "événements: lecture publiée" on public.events
  for select using (
    (
      status = 'published'
      and organizer_id in (select id from public.organizers where disabled = false)
    )
    or public.is_admin()
    or organizer_id in (select id from public.organizers where user_id = auth.uid())
  );
