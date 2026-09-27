-- Messages envoyés depuis la page de contact (lecture réservée à l'administration).
create table if not exists public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  phone        text,
  subject      text not null,
  message      text not null,
  handled      boolean not null default false,
  notified_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists "contact: admin uniquement" on public.contact_messages;
create policy "contact: admin uniquement" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());
