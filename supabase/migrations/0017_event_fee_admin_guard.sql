-- Les réglages financiers d'un événement (frais de service, commission
-- plateforme) sont réservés à l'admin. Le RLS laisse l'organisateur mettre à
-- jour sa propre ligne `events` : ce garde-fou bloque au niveau colonne, y
-- compris pour un appel direct à l'API REST.
create or replace function public.guard_event_fee_settings()
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
  if new.fee_percent is distinct from old.fee_percent
     or new.fee_payer is distinct from old.fee_payer
     or new.commission_rate is distinct from old.commission_rate then
    raise exception 'Réglages financiers réservés à l''administrateur.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists events_guard_fee_settings on public.events;
create trigger events_guard_fee_settings
  before update on public.events
  for each row execute function public.guard_event_fee_settings();
