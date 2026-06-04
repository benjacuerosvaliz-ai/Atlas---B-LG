-- BØLG Atlas v2 — conquest schema (Sesión v2, 2026-06-04)
--
-- Refunda el modelo del Atlas como un juego de conquista:
--   - cities: diccionario de ciudades visitadas (poblado on-demand desde
--     Mapbox cuando un usuario sube un viaje).
--   - city_visits: cada visita de un usuario a una ciudad. Una persona
--     puede tener varias visitas a la misma ciudad (historial).
--   - city_conquerors (view): por ciudad, el "ganador" actual según la
--     regla del PPT — orden de llegada manda, pero un visit con producto
--     B0LG visible destrona a los visits sin producto.
--   - user_conquest_stats (view): por usuario, cuántas ciudades / países
--     / continentes ha conquistado + cuándo fue su última conquista (para
--     el tiebreaker del ranking).
--   - user_country_status (function): para un usuario y un país, devuelve
--     'complete' / 'partial' / 'none' (para colorear el mapa personal).

-----------------------------------------------------------------------------
-- 1. cities
-----------------------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  -- Mapbox feature id estable. Permite dedupe entre usuarios que pican el
  -- mismo "Santiago, CL" desde el picker.
  mapbox_id text unique not null,
  name text not null,
  country_code text not null check (char_length(country_code) = 2),
  -- ISO 3166 7 continentes: AF, AN, AS, EU, NA, OC, SA. Lo seteamos
  -- desde el cliente cuando insertamos la ciudad (lookup en lib/geo.ts).
  continent_code text not null
    check (continent_code in ('AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA')),
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  created_at timestamptz not null default now()
);
create index cities_country_idx on public.cities (country_code);
create index cities_continent_idx on public.cities (continent_code);

-----------------------------------------------------------------------------
-- 2. city_visits
-----------------------------------------------------------------------------
create table public.city_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  -- Opcional para mantener trazabilidad con el viaje que originó la visita;
  -- borrar el trip deja la visita huérfana (no se borra) — la conquista no
  -- depende del trip, depende del visit.
  trip_id uuid references public.trips(id) on delete set null,
  -- True si el viaje asociado tenía ≥1 producto B0LG reclamado. Usado por
  -- la regla de destronación.
  bolg_visible bool not null default false,
  -- Cuándo se cargó la visita (no cuándo viajó el usuario). Es el campo
  -- que determina "primero en llegar" para la conquista.
  uploaded_at timestamptz not null default now(),
  -- Cuándo viajó el usuario (mes/año). Útil para mostrar en perfil, no
  -- para conquista.
  visited_at date,
  created_at timestamptz not null default now()
);
create index city_visits_user_idx on public.city_visits (user_id);
create index city_visits_city_idx on public.city_visits (city_id);
create index city_visits_conquest_idx on public.city_visits
  (city_id, bolg_visible desc, uploaded_at asc);

-----------------------------------------------------------------------------
-- 3. View: city_conquerors
-----------------------------------------------------------------------------
-- Para cada ciudad, el conquistador actual.
--   ORDER BY bolg_visible DESC, uploaded_at ASC, id ASC
--   → ganan los visits con producto B0LG; entre ellos, el más antiguo.
--   El id ASC al final solo es un desempate determinístico final.
create view public.city_conquerors as
select distinct on (cv.city_id)
  cv.city_id,
  cv.user_id as conqueror_id,
  cv.bolg_visible,
  cv.uploaded_at as conquered_at
from public.city_visits cv
order by cv.city_id, cv.bolg_visible desc, cv.uploaded_at asc, cv.id asc;

-----------------------------------------------------------------------------
-- 4. View: user_conquest_stats
-----------------------------------------------------------------------------
-- Conteos por usuario para el ranking.
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
-- 5. Function: user_country_status
-----------------------------------------------------------------------------
-- Devuelve por país (que tenga ≥1 ciudad registrada) el estado de
-- conquista para el usuario p_user_id: complete (visitó todas las
-- ciudades conocidas) / partial (algunas) / none.
create or replace function public.user_country_status(p_user_id uuid)
returns table(country_code text, status text)
language plpgsql
stable
set search_path = public
as $$
begin
  return query
  with country_totals as (
    select c.country_code, count(*)::int as total_cities
    from public.cities c
    group by c.country_code
  ),
  user_visits as (
    select c.country_code, count(distinct c.id)::int as visited_count
    from public.city_visits cv
    join public.cities c on c.id = cv.city_id
    where cv.user_id = p_user_id
    group by c.country_code
  )
  select
    ct.country_code,
    case
      when coalesce(uv.visited_count, 0) = 0 then 'none'
      when uv.visited_count >= ct.total_cities then 'complete'
      else 'partial'
    end as status
  from country_totals ct
  left join user_visits uv on uv.country_code = ct.country_code;
end;
$$;

revoke all on function public.user_country_status(uuid) from public;
grant execute on function public.user_country_status(uuid) to anon, authenticated;

-----------------------------------------------------------------------------
-- 6. View: country_status_global
-----------------------------------------------------------------------------
-- Para el mapa global: por país, su estado considerando a TODA la
-- comunidad. complete = todas las ciudades conocidas tienen conqueror,
-- partial = al menos una, none = ninguna.
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
-- 7. Trip flag: trips.migrated_to_v2
-----------------------------------------------------------------------------
-- Para que el script de migración manual no procese dos veces los viajes
-- viejos. Cualquier trip nuevo entra ya marcado en true.
alter table public.trips
  add column if not exists migrated_to_v2 boolean not null default false;

-----------------------------------------------------------------------------
-- 8. RLS
-----------------------------------------------------------------------------
alter table public.cities enable row level security;
alter table public.city_visits enable row level security;

-- cities: lectura pública, insert por cualquier autenticado (los usuarios
-- la pueblan al subir viajes), update/delete solo service_role.
create policy "cities_public_read"
  on public.cities for select to anon, authenticated using (true);
create policy "cities_authenticated_insert"
  on public.cities for insert to authenticated with check (true);

-- city_visits: lectura pública (necesaria para conquistadores + ranking),
-- insert / update / delete solo el owner.
create policy "city_visits_public_read"
  on public.city_visits for select to anon, authenticated using (true);
create policy "city_visits_owner_insert"
  on public.city_visits for insert to authenticated
  with check (auth.uid() = user_id);
create policy "city_visits_owner_update"
  on public.city_visits for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "city_visits_owner_delete"
  on public.city_visits for delete to authenticated using (auth.uid() = user_id);

-----------------------------------------------------------------------------
-- 9. Grants (Data API)
-----------------------------------------------------------------------------
grant select on public.cities to anon, authenticated;
grant insert on public.cities to authenticated;

grant select on public.city_visits to anon, authenticated;
grant insert, update, delete on public.city_visits to authenticated;

grant select on public.city_conquerors to anon, authenticated;
grant select on public.user_conquest_stats to anon, authenticated;
grant select on public.country_status_global to anon, authenticated;

-----------------------------------------------------------------------------
-- 10. PostgREST cache refresh
-----------------------------------------------------------------------------
notify pgrst, 'reload schema';
