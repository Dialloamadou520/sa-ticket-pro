-- Commission de la plateforme configurable par événement.
-- Taux appliqué aux revenus encaissés d'un événement pour calculer la part
-- plateforme affichée dans l'administration. Défaut : 10 % (0.10).
-- Réglable uniquement par les administrateurs (voir policy events existante).

alter table public.events add column if not exists commission_rate numeric(5,4)
  not null default 0.10
  check (commission_rate >= 0 and commission_rate <= 1);
