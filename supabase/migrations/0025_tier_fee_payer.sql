-- Qui supporte les frais de service, par catégorie de ticket.
-- `null` = la catégorie suit le réglage de l'événement (`events.fee_payer`).
alter table public.ticket_tiers add column if not exists fee_payer text
  check (fee_payer is null or fee_payer in ('buyer', 'organizer'));

-- Les frais d'une catégorie (taux et payeur) sont réservés à l'admin. Le RLS
-- laisse l'organisateur gérer ses catégories : ce garde-fou bloque au niveau
-- colonne, y compris pour un appel direct à l'API REST.
create or replace function public.guard_tier_fee_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() null = client service-role (serveur) ou SQL direct : autorisé.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.fee_percent is not null or new.fee_payer is not null then
      raise exception 'Réglages financiers réservés à l''administrateur.'
        using errcode = '42501';
    end if;
  elsif new.fee_percent is distinct from old.fee_percent
     or new.fee_payer is distinct from old.fee_payer then
    raise exception 'Réglages financiers réservés à l''administrateur.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists ticket_tiers_guard_fee_settings on public.ticket_tiers;
create trigger ticket_tiers_guard_fee_settings
  before insert or update on public.ticket_tiers
  for each row execute function public.guard_tier_fee_settings();
