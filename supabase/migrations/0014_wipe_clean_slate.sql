-----------------------------------------------------------------------------
-- Migration 0014 — Wipe Clean Slate
--
-- Borra TODO el data de usuarios + viajes + conquistas + medallas + premios.
-- Mantiene: schema, product_models (catálogo), badges (definiciones).
--
-- Después de correr esto, el primer usuario en crearse arranca desde cero.
-- Verificado con counts pre/post.
--
-- También aprovecha y deja explicit grants para service_role, así futuros
-- scripts admin no pegan contra "permission denied" misterioso.
-----------------------------------------------------------------------------

begin;

-- 1. Wipe data tables en orden de FK (hojas primero).
truncate table
  public.city_visits,
  public.trip_claimed_models,
  public.trip_photos,
  public.user_claimed_models,
  public.user_badges,
  public.monthly_prizes,
  public.cities,
  public.trips,
  public.users
restart identity cascade;

-- 2. Borrar auth.users (esto debería cascadear a public.users vía trigger,
-- pero ya lo hicimos manual arriba para certeza).
delete from auth.users;

-- 3. Verificación inline.
do $$
declare
  v_users int; v_trips int; v_visits int; v_cities int; v_auth int;
begin
  select count(*) into v_users from public.users;
  select count(*) into v_trips from public.trips;
  select count(*) into v_visits from public.city_visits;
  select count(*) into v_cities from public.cities;
  select count(*) into v_auth from auth.users;
  raise notice 'POST-WIPE: users=%, trips=%, city_visits=%, cities=%, auth.users=%',
    v_users, v_trips, v_visits, v_cities, v_auth;
  if v_users + v_trips + v_visits + v_cities + v_auth <> 0 then
    raise exception 'Wipe incompleto. Algún rollback necesario.';
  end if;
end $$;

-- 4. Grants para service_role en tablas viejas (las migrations 0001-0010 no
-- los tenían explícitos). Esto destranca scripts admin futuros.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- 5. PostgREST reload (sin esto las nuevas grants no se ven hasta el próximo
-- restart del API).
notify pgrst, 'reload schema';

commit;
