-- BØLG Atlas — filtro is_validated en views públicas (2026-06-29)
--
-- Problema:
--   Los viajes sospechosos (origen=destino, ≤1km) se insertan con
--   is_validated=false + validation_method='pending_review' en /trip/new.
--   Pero las views city_conquerors, user_conquest_stats y
--   country_status_global de la migración 0012 NO miran is_validated:
--   leen city_visits sin filtrar por el trip asociado. Resultado: un trip
--   fake inserta su city_visit y al instante conquista la ciudad, suma a
--   BØLG-100 hits y pinta el chip de país en el mapa global.
--
-- Fix:
--   Recreamos las tres views (drop + create — Postgres no permite
--   CREATE OR REPLACE VIEW cuando cambia la lista de columnas o el join)
--   joineando city_visits con trips y filtrando trips.is_validated = true.
--   city_visits.trip_id puede ser null (ON DELETE SET NULL), así que
--   usamos INNER JOIN para descartar también los huérfanos — si un trip
--   se borró, su visit ya no debería conquistar nada.
--
-- Personal:
--   La función user_country_status NO se toca. Las stats personales sí
--   muestran al usuario sus propios viajes pendientes (es su realidad);
--   solo el mundo descarta lo no-validado.
--
-- NO modificar la migración 0012 — esta 0017 es la fuente de verdad de
-- las views desde aquí en adelante.

-----------------------------------------------------------------------------
-- 1. Drop views dependientes en orden (la global depende de city_conquerors)
-----------------------------------------------------------------------------
drop view if exists public.country_status_global;
drop view if exists public.user_conquest_stats;
drop view if exists public.city_conquerors;

-----------------------------------------------------------------------------
-- 2. city_conquerors — solo visitas con trip validado
-----------------------------------------------------------------------------
create view public.city_conquerors as
select distinct on (cv.city_id)
  cv.city_id,
  cv.user_id as conqueror_id,
  cv.bolg_visible,
  cv.uploaded_at as conquered_at
from public.city_visits cv
join public.trips t on t.id = cv.trip_id
where t.is_validated = true
order by cv.city_id, cv.bolg_visible desc, cv.uploaded_at asc, cv.id asc;

-----------------------------------------------------------------------------
-- 3. user_conquest_stats — derivado de city_conquerors filtrado
-----------------------------------------------------------------------------
create view public.user_conquest_stats as
select
  cc.conqueror_id as user_id,
  count(distinct cc.city_id)::int as cities_conquered,
  count(distinct c.country_code)::int as countries_with_conquest,
  count(distinct c.continent_code)::int as continents_with_conquest,
  max(cc.conquered_at) as last_conquest_at
from public.city_conquerors cc
join public.cities c on c.id = cc.city_id
group by cc.conqueror_id;

-----------------------------------------------------------------------------
-- 4. country_status_global — derivado de city_conquerors filtrado
-----------------------------------------------------------------------------
create view public.country_status_global as
with totals as (
  select country_code, count(*)::int as total
  from public.cities
  group by country_code
),
conquered as (
  select c.country_code, count(distinct cc.city_id)::int as conquered_count
  from public.city_conquerors cc
  join public.cities c on c.id = cc.city_id
  group by c.country_code
)
select
  t.country_code,
  t.total,
  coalesce(co.conquered_count, 0) as conquered,
  case
    when coalesce(co.conquered_count, 0) = 0 then 'none'
    when co.conquered_count >= t.total then 'complete'
    else 'partial'
  end as status
from totals t
left join conquered co on co.country_code = t.country_code;

-----------------------------------------------------------------------------
-- 5. Grants (las views recreadas pierden los grants del 0012)
-----------------------------------------------------------------------------
grant select on public.city_conquerors to anon, authenticated;
grant select on public.user_conquest_stats to anon, authenticated;
grant select on public.country_status_global to anon, authenticated;

-----------------------------------------------------------------------------
-- 6. PostgREST cache refresh
-----------------------------------------------------------------------------
notify pgrst, 'reload schema';
