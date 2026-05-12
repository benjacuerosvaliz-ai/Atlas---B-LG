-- BØLG Atlas — add Instagram handle to user profile (Sesión 3.7)

alter table public.users
  add column if not exists instagram_handle text
    check (
      instagram_handle is null
      or instagram_handle ~ '^[a-z0-9._]{1,30}$'
    );

-- No index needed — handle is for display + click-out only, not queried.
