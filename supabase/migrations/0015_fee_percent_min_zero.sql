-- Plancher des frais de service ramené de 1,5 % à 0 % : l'admin peut désormais
-- supprimer complètement les frais, globalement ou par catégorie de ticket.

alter table public.app_settings drop constraint if exists app_settings_service_fee_percent_check;
alter table public.app_settings add constraint app_settings_service_fee_percent_check
  check (service_fee_percent >= 0 and service_fee_percent <= 100);

alter table public.ticket_tiers drop constraint if exists ticket_tiers_fee_percent_check;
alter table public.ticket_tiers add constraint ticket_tiers_fee_percent_check
  check (fee_percent is null or (fee_percent >= 0 and fee_percent <= 100));
