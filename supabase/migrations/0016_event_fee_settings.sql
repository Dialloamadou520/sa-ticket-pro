-- Frais de service réglables par événement : taux propre (null = taux global)
-- et partie qui les supporte (acheteur par défaut, organisateur si négocié).
alter table public.events add column if not exists fee_percent numeric(5, 2)
  check (fee_percent is null or (fee_percent >= 0 and fee_percent <= 100));

alter table public.events add column if not exists fee_payer text not null
  default 'buyer' check (fee_payer in ('buyer', 'organizer'));

-- Figé à l'achat : les paiements déjà encaissés gardent leur mode d'origine.
alter table public.payments add column if not exists fee_paid_by text not null
  default 'buyer' check (fee_paid_by in ('buyer', 'organizer'));
