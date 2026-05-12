-- BØLG Atlas — recalc user totals on trip changes (Sesión 3.5, 2026-05-12)
--
-- Keeps users.total_km and users.level fresh by hooking into trips
-- INSERT / UPDATE / DELETE. Levels follow the lookup table from
-- concepto §6 (Aprendiz → Yggdrasil).
--
-- The trigger is per-row, security-definer-ish via the function body
-- bypassing RLS because the user updating their own trip should also
-- see their own row update (which they can — RLS allows users update own
-- row already).

-----------------------------------------------------------------------------
-- 1. Pure level lookup
-----------------------------------------------------------------------------
create or replace function public.compute_level(km numeric)
returns int
language sql
immutable
as $$
  select case
    when km >= 100000 then 8
    when km >= 60000  then 7
    when km >= 30000  then 6
    when km >= 12000  then 5
    when km >= 5000   then 4
    when km >= 2000   then 3
    when km >= 500    then 2
    else 1
  end;
$$;

-----------------------------------------------------------------------------
-- 2. Recompute total_km + level for one user
-----------------------------------------------------------------------------
create or replace function public.recalc_user_totals_for(target_user uuid)
returns void
language plpgsql
as $$
declare
  new_total numeric;
begin
  select coalesce(sum(distance_km), 0)
    into new_total
    from public.trips
    where user_id = target_user;

  update public.users
     set total_km = new_total,
         level    = public.compute_level(new_total)
   where id = target_user;
end;
$$;

-----------------------------------------------------------------------------
-- 3. Trigger
-----------------------------------------------------------------------------
create or replace function public.trips_after_change()
returns trigger
language plpgsql
as $$
begin
  -- For UPDATE that switches user_id (rare), recompute both old and new.
  if (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id) then
    perform public.recalc_user_totals_for(old.user_id);
    perform public.recalc_user_totals_for(new.user_id);
  elsif tg_op = 'DELETE' then
    perform public.recalc_user_totals_for(old.user_id);
  else
    perform public.recalc_user_totals_for(new.user_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trips_recalc_user_totals on public.trips;
create trigger trips_recalc_user_totals
  after insert or update or delete on public.trips
  for each row execute function public.trips_after_change();

-----------------------------------------------------------------------------
-- 4. One-time backfill — trips inserted before this trigger landed are
--    re-summed against their owner so existing rows catch up.
-----------------------------------------------------------------------------
update public.users u
   set total_km = coalesce(t.total, 0),
       level    = public.compute_level(coalesce(t.total, 0))
  from (
    select user_id, sum(distance_km) as total
      from public.trips
     group by user_id
  ) t
 where u.id = t.user_id;
