-- Reversement des revenus aux organisateurs (Wave / Orange Money via DexPay).
-- L'organisateur enregistre son numéro de retrait, demande un reversement,
-- l'admin le déclenche : la plateforme envoie l'argent sur son compte.

alter table public.organizers add column if not exists payout_phone text;
alter table public.organizers add column if not exists payout_operator text
  check (payout_operator is null or payout_operator in ('wave', 'orange_money'));

create table if not exists public.payouts (
  id                  uuid primary key default gen_random_uuid(),
  organizer_id        uuid not null references public.organizers (id) on delete cascade,
  amount              integer not null check (amount > 0),
  currency            text not null default 'XOF',
  operator            text not null check (operator in ('wave', 'orange_money')),
  phone               text not null,
  status              text not null default 'requested'
                      check (status in ('requested', 'processing', 'completed', 'failed', 'cancelled')),
  provider_payout_id  text,
  provider_reference  text,
  failure_reason      text,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists payouts_organizer_idx on public.payouts (organizer_id);
create index if not exists payouts_status_idx on public.payouts (status);

alter table public.payouts enable row level security;

drop policy if exists "reversements: lecture organisateur" on public.payouts;
create policy "reversements: lecture organisateur" on public.payouts
  for select using (
    public.is_admin()
    or organizer_id in (select id from public.organizers where user_id = auth.uid())
  );

drop policy if exists "reversements: gestion admin" on public.payouts;
create policy "reversements: gestion admin" on public.payouts
  for all using (public.is_admin()) with check (public.is_admin());
