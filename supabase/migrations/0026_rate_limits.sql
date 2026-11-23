-- Limites de tentatives (anti force brute / anti abus) sur les routes publiques.
-- Un compteur par clé (action + IP ou utilisateur) sur une fenêtre glissante
-- fixe. Table et fonction réservées au client service-role.
create table if not exists public.rate_limits (
  key      text primary key,
  count    integer not null default 0,
  reset_at timestamptz not null
);

alter table public.rate_limits enable row level security;

-- Incrémente atomiquement le compteur et indique si la requête est autorisée.
-- `retry_after` = secondes restantes avant la réouverture de la fenêtre.
create or replace function public.rate_limit_hit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_reset timestamptz;
begin
  insert into public.rate_limits as r (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    count = case when r.reset_at <= now() then 1 else r.count + 1 end,
    reset_at = case
      when r.reset_at <= now() then now() + make_interval(secs => p_window_seconds)
      else r.reset_at
    end
  returning r.count, r.reset_at into v_count, v_reset;

  -- Ménage occasionnel des fenêtres expirées.
  if random() < 0.01 then
    delete from public.rate_limits where reset_at < now() - interval '1 hour';
  end if;

  return query select
    v_count <= p_max,
    greatest(0, ceil(extract(epoch from (v_reset - now()))))::integer;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
