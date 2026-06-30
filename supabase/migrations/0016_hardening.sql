-- BØLG Atlas — hardening (2026-06-29)
--
-- 1) Reserva de usernames (tabla + trigger).
-- 2) Anti-fraude básico en trips (rangos de distance_km y start_at no futuro).
-- 3) Índices para queries calientes (city_visits, trips, ranking users).
-- 4) Defensa en profundidad: city_visits insert solo si user_id = auth.uid().
-- 5) NOTIFY pgrst, 'reload schema'.

begin;

-----------------------------------------------------------------------------
-- 1. Reserved usernames
-----------------------------------------------------------------------------
create table if not exists public.reserved_usernames (
  username text primary key
);

-- Reads públicas (para que el cliente pueda chequear disponibilidad en vivo);
-- escrituras solo via service_role.
alter table public.reserved_usernames enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'reserved_usernames'
      and policyname = 'reserved_usernames select public'
  ) then
    create policy "reserved_usernames select public"
      on public.reserved_usernames for select using (true);
  end if;
end$$;

grant select on public.reserved_usernames to anon, authenticated;

-- Seed (case-insensitive: guardamos siempre en lower). on conflict para
-- absorber duplicados del listado original (atlas, premio venían dos veces).
insert into public.reserved_usernames (username) values
  ('admin'), ('administrator'), ('root'),
  ('bolg'), ('atlas'),
  ('support'), ('help'),
  ('api'), ('www'), ('mail'), ('info'), ('contact'),
  ('login'), ('signup'), ('signin'), ('signout'), ('logout'), ('register'),
  ('settings'), ('profile'), ('me'), ('you'),
  ('system'), ('test'), ('demo'),
  ('null'), ('undefined'),
  ('ranking'), ('premio'), ('sobre'), ('dashboard'),
  ('trip'), ('viaje'), ('viajes'),
  ('sku'), ('u'), ('t'), ('c'),
  ('conquista'), ('conquistador'),
  ('donde'), ('cuando'),
  ('equipo'), ('equipaje'),
  ('top'), ('mejor'),
  ('ciudad'), ('pais'), ('continente'),
  ('mapa'), ('badge'), ('medalla'),
  ('conquistar')
on conflict (username) do nothing;

-- Trigger que rechaza usernames reservados al insertar/actualizar public.users.
-- Comparación case-insensitive vs el seed en minúsculas.
create or replace function public.enforce_reserved_username()
returns trigger
language plpgsql
as $$
begin
  if new.username is null then
    return new;
  end if;
  if exists (
    select 1 from public.reserved_usernames
    where username = lower(new.username)
  ) then
    raise exception 'username "%" is reserved', new.username
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists users_reserved_username on public.users;
create trigger users_reserved_username
  before insert or update of username on public.users
  for each row execute function public.enforce_reserved_username();

-----------------------------------------------------------------------------
-- 2. Anti-fraude trip básico
-----------------------------------------------------------------------------
-- distance_km no negativo y dentro de un rango plausible (vuelta al mundo ~40k).
-- Nota: 0001 ya tenía `check (distance_km is null or distance_km >= 0)`.
-- Acá agregamos el techo superior como constraint independiente para no
-- chocar con el existente y poder droppearlo solo si se afina el umbral.
alter table public.trips
  drop constraint if exists trips_distance_km_sane;
alter table public.trips
  add constraint trips_distance_km_sane
  check (distance_km is null or (distance_km >= 0 and distance_km < 50000));

-- start_at no puede ser futuro. start_at es timestamptz, current_date es date:
-- Postgres castea date → timestamptz a medianoche en la TZ de sesión, lo que
-- hace este chequeo dependiente de TZ. Ver warnings abajo.
alter table public.trips
  drop constraint if exists trips_start_at_not_future;
alter table public.trips
  add constraint trips_start_at_not_future
  check (start_at is null or start_at <= current_date);

-----------------------------------------------------------------------------
-- 3. Índices para queries lentas
-----------------------------------------------------------------------------
create index if not exists city_visits_user_uploaded_idx
  on public.city_visits (user_id, uploaded_at desc);

create index if not exists city_visits_city_bolg_visible_idx
  on public.city_visits (city_id, bolg_visible);

create index if not exists trips_user_start_at_idx
  on public.trips (user_id, start_at desc);

create index if not exists users_total_km_idx
  on public.users (total_km desc);

-----------------------------------------------------------------------------
-- 4. Política city_visits: defensa en profundidad
-----------------------------------------------------------------------------
-- La policy original `city_visits_owner_insert` ya tiene with check
-- (auth.uid() = user_id). Reforzamos dropeando y recreándola explícita
-- como WITH CHECK + USING para que cualquier insert con user_id ajeno
-- falle aunque alguien refactoree mal en el futuro.
drop policy if exists "city_visits_owner_insert" on public.city_visits;
create policy "city_visits_owner_insert"
  on public.city_visits for insert to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());

-----------------------------------------------------------------------------
-- 5. Reload PostgREST schema cache
-----------------------------------------------------------------------------
notify pgrst, 'reload schema';

commit;
