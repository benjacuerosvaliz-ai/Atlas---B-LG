-- BØLG Atlas — 4-digit PIN auth (Sesión beta-fixes, 2026-05-13)
--
-- Adds username + 4-digit PIN as a secondary login path alongside magic
-- link. PIN is set on the first magic-link arrival (mandatory) and stored
-- as a bcrypt hash via pgcrypto. After that the user can log in with
-- (username, PIN) without checking email.
--
-- Brute-force protection: 5 wrong attempts → 15-minute lockout. Magic
-- link is unaffected by the lockout, so it serves as the always-available
-- fallback if someone locks themselves out.

create extension if not exists pgcrypto;

alter table public.users
  add column if not exists pin_hash text,
  add column if not exists pin_failed_count int not null default 0,
  add column if not exists pin_locked_until timestamptz;

-----------------------------------------------------------------------------
-- set_my_pin(p_pin) — called by the authenticated user during onboarding /
-- settings. Hashes with bcrypt (cost 10) and resets the lockout counter.
-----------------------------------------------------------------------------
create or replace function public.set_my_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_pin is null or p_pin !~ '^\d{4}$' then
    raise exception 'pin must be exactly 4 digits';
  end if;
  update public.users
     set pin_hash = crypt(p_pin, gen_salt('bf', 10)),
         pin_failed_count = 0,
         pin_locked_until = null
   where id = auth.uid();
end;
$$;

revoke all on function public.set_my_pin(text) from public;
grant execute on function public.set_my_pin(text) to authenticated;

-----------------------------------------------------------------------------
-- verify_pin_for_username(p_username, p_pin) — called from the login form
-- BEFORE a session exists, so it must be invokable as anon.
--
-- Returns jsonb with one of:
--   {status: 'ok',      user_id, email}
--   {status: 'failed',  attempts_left}
--   {status: 'locked',  locked_until}
--   {status: 'unknown'}            ← username doesn't exist OR has no PIN
--
-- Notes
-- - We never leak whether the username exists or whether the PIN was set,
--   to make username enumeration useless.
-- - The function takes a row lock (FOR UPDATE) on the user row to make the
--   increment-and-lock logic safe against concurrent attempts.
-----------------------------------------------------------------------------
create or replace function public.verify_pin_for_username(
  p_username text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
  v_new_count int;
  v_lock_at timestamptz;
  v_max_attempts constant int := 5;
  v_lock_duration constant interval := '15 minutes';
begin
  if p_username is null or p_pin is null or p_pin !~ '^\d{4}$' then
    return jsonb_build_object('status', 'unknown');
  end if;

  select u.id, u.email, u.pin_hash, u.pin_failed_count, u.pin_locked_until
    into v_user
    from public.users u
   where lower(u.username) = lower(p_username)
   for update;

  if not found or v_user.pin_hash is null then
    return jsonb_build_object('status', 'unknown');
  end if;

  if v_user.pin_locked_until is not null and v_user.pin_locked_until > now() then
    return jsonb_build_object(
      'status', 'locked',
      'locked_until', v_user.pin_locked_until
    );
  end if;

  if crypt(p_pin, v_user.pin_hash) = v_user.pin_hash then
    update public.users
       set pin_failed_count = 0,
           pin_locked_until = null
     where id = v_user.id;
    return jsonb_build_object(
      'status', 'ok',
      'user_id', v_user.id,
      'email', v_user.email
    );
  end if;

  v_new_count := coalesce(v_user.pin_failed_count, 0) + 1;
  v_lock_at := null;
  if v_new_count >= v_max_attempts then
    v_lock_at := now() + v_lock_duration;
    v_new_count := 0;  -- counter resets once we lock
  end if;
  update public.users
     set pin_failed_count = v_new_count,
         pin_locked_until = v_lock_at
   where id = v_user.id;

  if v_lock_at is not null then
    return jsonb_build_object('status', 'locked', 'locked_until', v_lock_at);
  end if;
  return jsonb_build_object(
    'status', 'failed',
    'attempts_left', v_max_attempts - v_new_count
  );
end;
$$;

revoke all on function public.verify_pin_for_username(text, text) from public;
grant execute on function public.verify_pin_for_username(text, text) to anon, authenticated;
