-- Numéro de téléphone saisi par l'acheteur au moment de l'achat (Wave /
-- Orange Money), affiché dans la liste des participants de l'organisateur.
alter table public.payments add column if not exists customer_phone text;
