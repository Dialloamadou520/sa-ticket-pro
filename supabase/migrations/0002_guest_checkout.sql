-- =============================================================================
-- Sa Ticket Pro — Achat invité (guest checkout)
-- Permet d'acheter un ticket sans compte : user_id devient optionnel et on
-- conserve les coordonnées de l'invité (email/nom) pour l'envoi du ticket.
-- Idempotent — réexécutable sans erreur.
-- =============================================================================

-- Paiements : user_id optionnel + coordonnées invité
alter table public.payments alter column user_id drop not null;
alter table public.payments add column if not exists guest_email text;
alter table public.payments add column if not exists guest_name  text;

-- Tickets : user_id optionnel + email du porteur (invité)
alter table public.tickets alter column user_id drop not null;
alter table public.tickets add column if not exists holder_email text;
