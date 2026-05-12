-- BØLG Atlas — short place names on trips (Sesión 3.8)
--
-- Trip cards were showing the full Mapbox-formatted place name
-- ("Región Metropolitana de Santiago, Chile") which is too long and
-- often identical across many trips. We now persist the short Mapbox
-- "name" field too (e.g. "Santiago", "Pucón"), and trip cards render
-- "Origen → Destino" so the journey is legible at a glance.

alter table public.trips
  add column if not exists start_short_name text,
  add column if not exists end_short_name text;

-- Best-effort backfill for trips inserted before this column existed:
-- take everything up to the first comma in the formatted name.
update public.trips
   set start_short_name = trim(split_part(start_place_name, ',', 1))
 where start_short_name is null
   and start_place_name is not null;

update public.trips
   set end_short_name = trim(split_part(end_place_name, ',', 1))
 where end_short_name is null
   and end_place_name is not null;
