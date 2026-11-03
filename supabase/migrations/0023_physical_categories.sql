-- Catégories propres aux billets physiques : nom + prix imprimé, sans créer de
-- catégorie vendue en ligne. Le prix est figé sur le lot au moment de la
-- génération (y compris pour les catégories en ligne réutilisées).
alter table public.ticket_print_batches add column if not exists price integer
  check (price is null or price >= 0);
