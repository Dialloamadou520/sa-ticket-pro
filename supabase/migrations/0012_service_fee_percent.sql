-- Frais de service : un seul mode, un pourcentage du prix du ticket payé par
-- l'acheteur. Remplace le barème par paliers, l'option « aucun frais » et
-- l'interrupteur global. L'admin peut seulement augmenter le taux (min 1,5 %).

alter table public.app_settings add column if not exists service_fee_percent
  numeric(5, 2) not null default 1.5
  check (service_fee_percent >= 1.5 and service_fee_percent <= 100);

update public.app_settings set service_fee_percent = 1.5 where id = true;

-- Le mode par événement n'est plus lu par l'application.
alter table public.events drop column if exists fee_mode;
alter table public.app_settings drop column if exists service_fees_enabled;
