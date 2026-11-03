-- Billets physiques : QR codes générés à l'avance par lots, imprimés sur des
-- tickets papier et vendus hors plateforme (guichet, points de vente). Ils
-- passent au scanner comme les autres mais ne comptent pas dans tickets_sold,
-- donc ni dans les revenus ni dans les commissions.
create table if not exists public.ticket_print_batches (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  tier_id      uuid references public.ticket_tiers (id) on delete set null,
  tier_name    text,
  label        text,
  quantity     integer not null check (quantity > 0),
  first_number integer not null check (first_number > 0),
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists ticket_print_batches_event_idx
  on public.ticket_print_batches (event_id);

-- Lecture/écriture uniquement via le client service-role (après contrôle
-- propriétaire / co-organisateur côté serveur).
alter table public.ticket_print_batches enable row level security;

alter table public.tickets add column if not exists is_physical boolean not null default false;
alter table public.tickets add column if not exists print_batch_id uuid
  references public.ticket_print_batches (id) on delete set null;
alter table public.tickets add column if not exists print_number integer;
create index if not exists tickets_print_batch_idx on public.tickets (print_batch_id);

create or replace function public.increment_tickets_sold()
returns trigger
language plpgsql
as $$
begin
  if new.is_invitation or new.is_physical then
    return new;
  end if;
  update public.events
  set tickets_sold = tickets_sold + 1
  where id = new.event_id;
  return new;
end;
$$;
