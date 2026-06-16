-- BØLG Atlas — lock down public.users PII (Sesión seguridad, 2026-06-16)
--
-- Background
-- ----------
-- Until now public.users was reachable by anon via PostgREST with a
-- `for select using (true)` RLS policy that returned every column —
-- including email, pin_hash, pin_failed_count, pin_locked_until. An
-- anonymous visitor could hit /rest/v1/users?select=email,username and
-- enumerate every account's email address.
--
-- This migration:
--   1. Creates a `public.users_public` view exposing ONLY the columns
--      that are safe to render in public profiles, the explore page, the
--      atlas leaderboard, OG images, etc.
--   2. Grants SELECT on the view to anon + authenticated.
--   3. Revokes column-level SELECT on the sensitive columns (email,
--      pin_hash, pin_failed_count, pin_locked_until) from anon AND
--      authenticated, so even a direct query against /rest/v1/users with
--      `select=email` gets a permission error.
--   4. Keeps the existing `users select public` RLS policy intact so the
--      existing read paths (loaders, ranking, profile page, OG image)
--      that select non-sensitive columns by name continue to work.
--   5. The auth-definer RPC verify_pin_for_username and any service_role
--      caller (createAdminClient) bypass these grants entirely, so the
--      cron job and PIN login flow are unaffected.
--   6. NOTIFY pgrst so PostgREST picks up the new view immediately.

------------------------------------------------------------------------
-- 1. View with only the safe profile columns
------------------------------------------------------------------------
create or replace view public.users_public
with (security_invoker = true) as
select
  id,
  username,
  display_name,
  avatar_url,
  bio,
  city,
  country_code,
  instagram_handle,
  total_km,
  level,
  created_at
from public.users;

comment on view public.users_public is
  'Public-safe projection of public.users. Use this from anon code paths '
  'instead of querying public.users directly — it omits email and all '
  'pin_* columns so PII can never leak via the REST endpoint.';

------------------------------------------------------------------------
-- 2. Grant SELECT on the view to anon + authenticated.
------------------------------------------------------------------------
grant select on public.users_public to anon, authenticated;

------------------------------------------------------------------------
-- 3. Revoke column-level SELECT for sensitive columns on the base table.
--    Anon and authenticated lose access entirely to these columns. Code
--    paths that select them continue to work only under service_role
--    (createAdminClient bypasses RLS + grants), e.g. the monthly-prize
--    cron and admin endpoints.
------------------------------------------------------------------------
revoke select (email, pin_hash, pin_failed_count, pin_locked_until)
  on public.users
  from anon, authenticated;

------------------------------------------------------------------------
-- 4. Re-grant SELECT on the remaining (safe) columns to anon +
--    authenticated. This restores the column set that the existing read
--    paths (explorar, /u/[username], /atlas, /sobre, OG image,
--    /t/[trip_id], dashboard, settings) already select by name. The RLS
--    policy `users select public` (using (true)) from 0001 still applies
--    on top, so row visibility is unchanged.
------------------------------------------------------------------------
grant select (
  id,
  username,
  display_name,
  avatar_url,
  cover_url,
  bio,
  city,
  country_code,
  instagram_handle,
  total_km,
  level,
  is_verified,
  created_at,
  updated_at
) on public.users to anon, authenticated;

------------------------------------------------------------------------
-- 5. Tighten the RLS policies so an authenticated user can still read
--    their own full row (including email, if any future code wants it
--    via the supabase client) without leaking other users' sensitive
--    columns. The base column grants above are the actual security
--    boundary for the sensitive columns; this policy just ensures the
--    user keeps access to their own row, which combined with the
--    existing `users select public` policy lets them see every public
--    column on every row plus their own private columns (which they
--    still can't see in practice because the column grant is revoked
--    for the authenticated role — meaning to read email you must use
--    auth.user().email or a service_role call. This is intentional and
--    matches how the rest of the codebase already gets email).
------------------------------------------------------------------------
-- (No new policy needed — the existing `users select public` from 0001
-- already covers SELECT, and column grants do the heavy lifting.)

------------------------------------------------------------------------
-- 6. Reload PostgREST schema cache so the new view + grants take effect
--    immediately, without waiting for the periodic reload.
------------------------------------------------------------------------
notify pgrst, 'reload schema';
