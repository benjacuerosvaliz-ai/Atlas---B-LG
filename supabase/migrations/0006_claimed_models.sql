-- BØLG Atlas — claimed-model layer (Sesión 3.5, 2026-05-12)
--
-- Self-claimed product ownership: when a user marks "Viajé con este Oslo"
-- in the trip wizard, we don't have a serial / QR-verified product unit,
-- but we still want to (1) credit the model on the trip and (2) grow the
-- user's collection on /u/[username].
--
-- Two tables:
--   - user_claimed_models   : the user's *collection* (idempotent — one
--                              row per (user, model)). Grows as a side
--                              effect of any trip claim.
--   - trip_claimed_models   : the *per-trip* tagging — which model was
--                              with the user on that specific trip.
--
-- This layer coexists with the QR-verified flow (Sesión 5): products +
-- product_owners + trip_products. UI can show "verified" vs "self-claimed"
-- by joining either side.

-----------------------------------------------------------------------------
-- user_claimed_models — durable collection
-----------------------------------------------------------------------------
create table public.user_claimed_models (
  user_id uuid not null references public.users(id) on delete cascade,
  model_id text not null references public.product_models(id) on delete cascade,
  first_claimed_at timestamptz not null default now(),
  primary key (user_id, model_id)
);

create index user_claimed_models_user_id_idx on public.user_claimed_models (user_id);

-----------------------------------------------------------------------------
-- trip_claimed_models — per-trip tagging
-----------------------------------------------------------------------------
create table public.trip_claimed_models (
  trip_id uuid not null references public.trips(id) on delete cascade,
  model_id text not null references public.product_models(id) on delete cascade,
  primary key (trip_id, model_id)
);

create index trip_claimed_models_model_id_idx on public.trip_claimed_models (model_id);

-----------------------------------------------------------------------------
-- Grants — same pattern as the rest of public schema
-----------------------------------------------------------------------------
grant select on public.user_claimed_models to anon, authenticated;
grant insert, update, delete on public.user_claimed_models to authenticated;

grant select on public.trip_claimed_models to anon, authenticated;
grant insert, update, delete on public.trip_claimed_models to authenticated;

-----------------------------------------------------------------------------
-- Row Level Security — broadcast-public reads, owner-only writes
-----------------------------------------------------------------------------
alter table public.user_claimed_models enable row level security;

create policy "user_claimed_models select public"
  on public.user_claimed_models for select using (true);
create policy "user_claimed_models insert own"
  on public.user_claimed_models for insert with check (auth.uid() = user_id);
create policy "user_claimed_models delete own"
  on public.user_claimed_models for delete using (auth.uid() = user_id);
-- No UPDATE needed (rows are immutable once created).

alter table public.trip_claimed_models enable row level security;

create policy "trip_claimed_models select via trip"
  on public.trip_claimed_models for select using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (
          t.visibility = 'public'
          or auth.uid() = t.user_id
          or (
            t.visibility = 'followers'
            and exists (
              select 1 from public.follows
              where follower_id = auth.uid() and followee_id = t.user_id
            )
          )
        )
    )
  );

create policy "trip_claimed_models manage by trip owner"
  on public.trip_claimed_models for all
  using (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );
