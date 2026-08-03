-- Jauge de remplissage « marketing » affichée au public.
-- L'organisateur choisit un pourcentage à afficher sur la page publique et les
-- cartes (ex. « 75 % vendu ») pour créer un effet d'urgence. Les vraies ventes
-- (events.tickets_sold) restent réservées à l'organisateur et à l'admin.
-- NULL = aucune jauge affichée (comportement par défaut).

alter table public.events add column if not exists display_fill_percent smallint
  check (display_fill_percent >= 0 and display_fill_percent <= 100);
