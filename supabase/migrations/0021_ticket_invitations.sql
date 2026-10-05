-- Invitations : billets gratuits générés par l'organisateur (invités, presse)
-- sans paiement. Ils ne comptent pas dans tickets_sold, donc ni dans les
-- revenus ni dans les commissions.
alter table public.tickets add column if not exists is_invitation boolean not null default false;
alter table public.tickets add column if not exists holder_phone text;
alter table public.tickets add column if not exists invited_by uuid
  references public.profiles (id) on delete set null;

create or replace function public.increment_tickets_sold()
returns trigger
language plpgsql
as $$
begin
  if new.is_invitation then
    return new;
  end if;
  update public.events
  set tickets_sold = tickets_sold + 1
  where id = new.event_id;
  return new;
end;
$$;
