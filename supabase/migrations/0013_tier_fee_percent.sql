-- Frais de service réglables par catégorie de ticket (Standard, VIP, VVIP…).
-- `null` = la catégorie suit le pourcentage global de `app_settings`.

alter table public.ticket_tiers add column if not exists fee_percent
  numeric(5, 2)
  check (fee_percent is null or (fee_percent >= 1.5 and fee_percent <= 100));
