-- BØLG Atlas — enable Realtime for the trips table (Sesión 6)
--
-- Supabase Realtime is opt-in per table. We need /atlas to react to new
-- trip inserts (and updates) live without polling, so we add the trips
-- table to the supabase_realtime publication.

alter publication supabase_realtime add table public.trips;
