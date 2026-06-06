-- =============================================================================
-- Sa Ticket Pro — Schéma initial
-- Exécuter dans le SQL Editor de Supabase (ou via `supabase db push`).
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums -----------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('participant', 'organizer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_status as enum ('draft', 'pending', 'published', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_type as enum ('standard', 'vip', 'gratuit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('valid', 'used', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider as enum ('wave', 'orange_money', 'dexpay');
exception when duplicate_object then null; end $$;

-- Tables ----------------------------------------------------------------------

-- Profils (1-1 avec auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  avatar_url  text,
  role        user_role not null default 'participant',
  created_at  timestamptz not null default now()
);

-- Organisateurs
create table if not exists public.organizers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  company_name text not null,
  description  text,
  logo_url     text,
  verified     boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (user_id)
);

-- Catégories
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  icon       text,
  created_at timestamptz not null default now()
);

-- Événements
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  organizer_id uuid not null references public.organizers (id) on delete cascade,
  title        text not null,
  description  text,
  banner_url   text,
  category_id  uuid references public.categories (id) on delete set null,
  location     text not null,
  city         text,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  capacity     integer not null default 0 check (capacity >= 0),
  price        integer not null default 0 check (price >= 0),
  ticket_type  ticket_type not null default 'standard',
  status       event_status not null default 'draft',
  tickets_sold integer not null default 0 check (tickets_sold >= 0),
  created_at   timestamptz not null default now()
);
create index if not exists events_status_idx on public.events (status);
create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_category_idx on public.events (category_id);

-- Paiements
create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  event_id           uuid not null references public.events (id) on delete cascade,
  amount             integer not null check (amount >= 0),
  currency           text not null default 'XOF',
  provider           payment_provider not null,
  status             payment_status not null default 'pending',
  provider_reference text,
  quantity           integer not null default 1 check (quantity > 0),
  ticket_type        ticket_type not null default 'standard',
  created_at         timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists payments_event_idx on public.payments (event_id);

-- Tickets
create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  payment_id  uuid references public.payments (id) on delete set null,
  ticket_type ticket_type not null default 'standard',
  price       integer not null default 0,
  qr_token    text not null unique default encode(gen_random_bytes(16), 'hex'),
  status      ticket_status not null default 'valid',
  holder_name text,
  created_at  timestamptz not null default now()
);
create index if not exists tickets_event_idx on public.tickets (event_id);
create index if not exists tickets_user_idx on public.tickets (user_id);

-- Scans (contrôle d'accès)
create table if not exists public.scans (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets (id) on delete cascade,
  scanned_by uuid references public.profiles (id) on delete set null,
  result     text not null check (result in ('valid', 'already_used', 'invalid')),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Fonctions & triggers
-- =============================================================================

-- Vérifie si l'utilisateur courant est admin (security definer pour éviter la récursion RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'participant')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Incrémente events.tickets_sold à chaque ticket créé
create or replace function public.increment_tickets_sold()
returns trigger
language plpgsql
as $$
begin
  update public.events
  set tickets_sold = tickets_sold + 1
  where id = new.event_id;
  return new;
end;
$$;

drop trigger if exists on_ticket_created on public.tickets;
create trigger on_ticket_created
  after insert on public.tickets
  for each row execute function public.increment_tickets_sold();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles   enable row level security;
alter table public.organizers enable row level security;
alter table public.categories enable row level security;
alter table public.events     enable row level security;
alter table public.payments   enable row level security;
alter table public.tickets    enable row level security;
alter table public.scans      enable row level security;

-- Profiles
create policy "profils: lecture propre" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profils: mise à jour propre" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- Organizers
create policy "organisateurs: lecture publique" on public.organizers
  for select using (true);
create policy "organisateurs: gestion propre" on public.organizers
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Categories
create policy "catégories: lecture publique" on public.categories
  for select using (true);
create policy "catégories: écriture admin" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- Events
create policy "événements: lecture publiée" on public.events
  for select using (
    status = 'published'
    or public.is_admin()
    or organizer_id in (select id from public.organizers where user_id = auth.uid())
  );
create policy "événements: création organisateur" on public.events
  for insert with check (
    organizer_id in (select id from public.organizers where user_id = auth.uid())
  );
create policy "événements: gestion propriétaire" on public.events
  for update using (
    public.is_admin()
    or organizer_id in (select id from public.organizers where user_id = auth.uid())
  );
create policy "événements: suppression propriétaire" on public.events
  for delete using (
    public.is_admin()
    or organizer_id in (select id from public.organizers where user_id = auth.uid())
  );

-- Payments
create policy "paiements: lecture propre" on public.payments
  for select using (auth.uid() = user_id or public.is_admin());
create policy "paiements: création propre" on public.payments
  for insert with check (auth.uid() = user_id);

-- Tickets
create policy "tickets: lecture autorisée" on public.tickets
  for select using (
    auth.uid() = user_id
    or public.is_admin()
    or event_id in (
      select e.id from public.events e
      join public.organizers o on o.id = e.organizer_id
      where o.user_id = auth.uid()
    )
  );
create policy "tickets: création propre" on public.tickets
  for insert with check (auth.uid() = user_id);
create policy "tickets: mise à jour organisateur" on public.tickets
  for update using (
    public.is_admin()
    or event_id in (
      select e.id from public.events e
      join public.organizers o on o.id = e.organizer_id
      where o.user_id = auth.uid()
    )
  );

-- Scans
create policy "scans: organisateur" on public.scans
  for all using (
    public.is_admin()
    or ticket_id in (
      select t.id from public.tickets t
      join public.events e on e.id = t.event_id
      join public.organizers o on o.id = e.organizer_id
      where o.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or ticket_id in (
      select t.id from public.tickets t
      join public.events e on e.id = t.event_id
      join public.organizers o on o.id = e.organizer_id
      where o.user_id = auth.uid()
    )
  );
