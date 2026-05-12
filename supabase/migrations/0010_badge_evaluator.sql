-- BØLG Atlas — travel-focused badges + automated awarding (Sesión B)
--
-- Rewrites the badge catalog around exploration / travel themes (the
-- original 0002 seed had "Maratonista" and other less-travel-y ones).
-- Adds a PL/pgSQL function that evaluates a user's badge criteria and
-- inserts into user_badges (idempotent via ON CONFLICT). Fires from a
-- trigger on every public trip INSERT/UPDATE.
--
-- SECURITY DEFINER on the evaluator so it can read trips across all
-- users (needed for first_mover) and write into user_badges (where
-- users have no INSERT policy by design — badges are system-awarded).

-----------------------------------------------------------------------------
-- 1. Re-seed the badge catalog around travel
-----------------------------------------------------------------------------

-- Drop the badges that depended on data we don't capture
-- (volcanero/sal_del_mundo/anti_turista need terrain tags, caudillo needs
-- a referral system, heritage_keeper relied on the cancelled QR/Heritage
-- flow, maratonista is too athletic-flavored per Benja). Cascades will
-- clear any awarded user_badges for these.
delete from public.badges
 where id in (
   'maratonista',
   'volcanero',
   'sal_del_mundo',
   'caudillo',
   'anti_turista',
   'heritage_keeper'
 );

-- Update existing keepers
update public.badges
   set name = 'Aurora',
       description = 'Trip arriba del paralelo 60° — la luz del norte (o del sur extremo).',
       rarity = 'rare'
 where id = 'aurora';

update public.badges
   set name = 'Antípoda',
       description = 'Dos trips en puntos opuestos del planeta. Cruzaste el mundo entero.',
       rarity = 'epic'
 where id = 'antipoda';

update public.badges
   set name = 'First Mover',
       description = 'Primer cliente BØLG en pisar un país nuevo. Bandera plantada.',
       rarity = 'legendary'
 where id = 'first_mover';

update public.badges
   set name = 'Equinoccio',
       description = 'Trip subido el día exacto del equinoccio. Buen timing.',
       rarity = 'rare'
 where id = 'equinoccio';

-- Insert the new travel-flavored badges
insert into public.badges (id, name, description, rarity) values
  (
    'viajero_casual',
    'Viajero Casual',
    'Subiste tu primer viaje al Atlas. Bienvenido a la flota.',
    'common'
  ),
  (
    'trotamundos',
    'Trotamundos',
    'Cinco países distintos en tu Atlas. Empezó la cruzada.',
    'rare'
  ),
  (
    'andino',
    'Andino',
    'Trip en la Cordillera de los Andes: Chile, Argentina, Perú, Bolivia, Ecuador, Colombia o Venezuela.',
    'common'
  ),
  (
    'hemisferios',
    'Cruzaste el Ecuador',
    'Trips registrados en el hemisferio norte Y en el sur. Sin reglas.',
    'rare'
  )
on conflict (id) do update
   set name = excluded.name,
       description = excluded.description,
       rarity = excluded.rarity;

-----------------------------------------------------------------------------
-- 2. Evaluator function
-----------------------------------------------------------------------------
create or replace function public.evaluate_user_badges(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  has_north bool;
  has_south bool;
  countries_count int;
begin
  if target_user is null then
    return;
  end if;

  -- viajero_casual — cualquier trip existente.
  if exists (select 1 from public.trips where user_id = target_user) then
    insert into public.user_badges (user_id, badge_id)
    values (target_user, 'viajero_casual')
    on conflict do nothing;
  end if;

  -- andino — trip cuyo country_codes incluye alguno de los andinos.
  if exists (
    select 1 from public.trips t
    where t.user_id = target_user
      and t.country_codes && array['cl','ar','pe','bo','ec','co','ve']
  ) then
    insert into public.user_badges (user_id, badge_id)
    values (target_user, 'andino')
    on conflict do nothing;
  end if;

  -- trotamundos — 5+ países distintos a lo largo de todos sus trips.
  select count(distinct c) into countries_count
    from public.trips t, unnest(t.country_codes) c
   where t.user_id = target_user
     and c is not null
     and c <> '';
  if countries_count >= 5 then
    insert into public.user_badges (user_id, badge_id)
    values (target_user, 'trotamundos')
    on conflict do nothing;
  end if;

  -- hemisferios — al menos un punto al norte del ecuador Y al menos uno al sur.
  select
    exists (
      select 1 from public.trips
      where user_id = target_user
        and (
          (start_lat is not null and start_lat > 0)
          or (end_lat is not null and end_lat > 0)
        )
    ),
    exists (
      select 1 from public.trips
      where user_id = target_user
        and (
          (start_lat is not null and start_lat < 0)
          or (end_lat is not null and end_lat < 0)
        )
    )
    into has_north, has_south;
  if has_north and has_south then
    insert into public.user_badges (user_id, badge_id)
    values (target_user, 'hemisferios')
    on conflict do nothing;
  end if;

  -- aurora — trip arriba del paralelo 60° (norte o sur).
  if exists (
    select 1 from public.trips
    where user_id = target_user
      and (
        (start_lat is not null and abs(start_lat) > 60)
        or (end_lat is not null and abs(end_lat) > 60)
      )
  ) then
    insert into public.user_badges (user_id, badge_id)
    values (target_user, 'aurora')
    on conflict do nothing;
  end if;

  -- equinoccio — trip subido el día del equinoccio (~19-21 mar, ~21-23 sep).
  if exists (
    select 1 from public.trips
    where user_id = target_user
      and start_at is not null
      and (
        (extract(month from start_at) = 3 and extract(day from start_at) between 19 and 21)
        or (extract(month from start_at) = 9 and extract(day from start_at) between 21 and 23)
      )
  ) then
    insert into public.user_badges (user_id, badge_id)
    values (target_user, 'equinoccio')
    on conflict do nothing;
  end if;

  -- antipoda — dos trips en puntos antipodales del mismo usuario (lat opuesto,
  -- lng ±180). Tolerancia 10° porque Mapbox da coords a nivel ciudad.
  if exists (
    select 1
    from public.trips t1, public.trips t2
    where t1.user_id = target_user
      and t2.user_id = target_user
      and t1.id <> t2.id
      and t1.start_lat is not null
      and t2.start_lat is not null
      and abs(t1.start_lat + t2.start_lat) < 10
      and abs(abs(t1.start_lng - t2.start_lng) - 180) < 10
  ) then
    insert into public.user_badges (user_id, badge_id)
    values (target_user, 'antipoda')
    on conflict do nothing;
  end if;

  -- first_mover — primer cliente público en pisar un país (existe al menos un
  -- país en sus trips para el que nadie más tiene un trip público anterior).
  if exists (
    select 1
    from public.trips t
    where t.user_id = target_user
      and t.visibility = 'public'
      and t.country_codes is not null
      and array_length(t.country_codes, 1) > 0
      and exists (
        select 1 from unnest(t.country_codes) c
        where not exists (
          select 1 from public.trips earlier
          where earlier.user_id <> target_user
            and earlier.visibility = 'public'
            and c = any(earlier.country_codes)
            and earlier.start_at is not null
            and t.start_at is not null
            and earlier.start_at < t.start_at
        )
      )
  ) then
    insert into public.user_badges (user_id, badge_id)
    values (target_user, 'first_mover')
    on conflict do nothing;
  end if;
end;
$$;

-----------------------------------------------------------------------------
-- 3. Trigger: re-evaluate after every trip change
-----------------------------------------------------------------------------
create or replace function public.trips_after_change_badges()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id) then
    perform public.evaluate_user_badges(old.user_id);
    perform public.evaluate_user_badges(new.user_id);
  else
    perform public.evaluate_user_badges(coalesce(new.user_id, old.user_id));
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trips_evaluate_badges on public.trips;
create trigger trips_evaluate_badges
  after insert or update on public.trips
  for each row execute function public.trips_after_change_badges();

-----------------------------------------------------------------------------
-- 4. One-time backfill — every user that already has trips gets re-evaluated
-----------------------------------------------------------------------------
do $$
declare
  uid uuid;
begin
  for uid in (select distinct user_id from public.trips where user_id is not null) loop
    perform public.evaluate_user_badges(uid);
  end loop;
end $$;
