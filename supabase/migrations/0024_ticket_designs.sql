-- Design de billet de l'organisateur, enregistré par catégorie : utilisé pour
-- imprimer les billets physiques et affiché sur les billets numériques de la
-- même catégorie (page du billet, PDF, image).
create table if not exists public.ticket_designs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  -- Nom de catégorie normalisé (minuscules, sans accents).
  category   text not null,
  image_url  text not null,
  width_mm   numeric not null check (width_mm > 0),
  height_mm  numeric not null check (height_mm > 0),
  qr         jsonb not null,
  number     jsonb not null,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (event_id, category)
);

-- Lecture/écriture uniquement via le client service-role (après contrôle
-- propriétaire / co-organisateur côté serveur).
alter table public.ticket_designs enable row level security;
