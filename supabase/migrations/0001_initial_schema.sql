-- BØLG Atlas — initial schema (Sesión 2, 2026-05-12)
--
-- Creates the full data model per concepto §9: 14 tables, PostGIS geom on
-- trips, indexes for hot query paths, an auth.users → public.users mirror
-- trigger, table-level grants for the Data API (auto-expose was disabled
-- at project setup), and Row Level Security policies.
--
-- Policy default: broadcast-public reads, owner-only writes. Admin writes
-- (product_models, badges, expeditions, awarding user_badges) go through
-- service_role.

-----------------------------------------------------------------------------
-- 1. Extensions
-----------------------------------------------------------------------------
create extension if not exists postgis;
-- gen_random_uuid() is built into Postgres ≥13 (Supabase ships ≥15), no
-- pgcrypto needed.

-----------------------------------------------------------------------------
-- 2. Helper: bump updated_at on every UPDATE
-----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-----------------------------------------------------------------------------
-- 3. Tables
-----------------------------------------------------------------------------

-- users -------------------------------------------------------------------
-- Profile mirror of auth.users. Filled by trigger on signup; the user picks
-- a real username/display_name in onboarding.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null
    check (username ~ '^[a-z0-9_]{3,30}$'),
  email text unique not null,
  display_name text,
  bio text check (char_length(bio) <= 280),
  avatar_url text,
  cover_url text,
  country_code text check (char_length(country_code) = 2),
  city text,
  level int not null default 1 check (level between 1 and 8),
  total_km numeric not null default 0 check (total_km >= 0),
  is_verified bool not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger users_touch
  before update on public.users
  for each row execute function public.touch_updated_at();

-- product_models ---------------------------------------------------------
-- Catalog. Admin-managed (service_role only on writes).
create table public.product_models (
  id text primary key,
  sku text unique,
  name text not null,
  category text check (
    category in (
      'mochila', 'botella', 'mug', 'duffel',
      'billetera', 'jockey', 'llavero'
    )
  ),
  description text,
  hero_image_url text,
  launched_year int,
  created_at timestamptz not null default now()
);

-- products ---------------------------------------------------------------
-- Physical units. INSERT/DELETE via service_role (manufacturing flow).
-- UPDATE: current owner only (rename, transfer, mark lost, etc.).
create table public.products (
  id uuid primary key default gen_random_uuid(),
  model_id text not null references public.product_models(id) on delete restrict,
  serial_number text unique not null,
  manufactured_at date,
  current_owner_id uuid references public.users(id) on delete set null,
  given_name text,
  total_km numeric not null default 0 check (total_km >= 0),
  countries_visited int not null default 0 check (countries_visited >= 0),
  trips_count int not null default 0 check (trips_count >= 0),
  status text not null default 'active'
    check (status in ('active', 'lost', 'retired')),
  legendary_tier text
    check (legendary_tier in ('wayfarer', 'skald', 'legendary')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();

-- product_owners ---------------------------------------------------------
-- Heritage history. One row per ownership stretch.
create table public.product_owners (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  acquired_at date not null default current_date,
  released_at date,
  acquired_via text not null default 'purchase'
    check (acquired_via in ('purchase', 'gift', 'inheritance', 'second_hand')),
  created_at timestamptz not null default now(),
  check (released_at is null or released_at >= acquired_at)
);

-- trips ------------------------------------------------------------------
-- Atomic unit of activity. PostGIS geom is the route polyline (SRID 4326).
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  description text,
  cover_photo_url text,
  start_at timestamptz,
  end_at timestamptz,
  distance_km numeric check (distance_km is null or distance_km >= 0),
  elevation_gain_m numeric,
  start_lat double precision,
  start_lng double precision,
  end_lat double precision,
  end_lng double precision,
  start_place_name text,
  end_place_name text,
  country_codes text[],
  activity_type text
    check (activity_type in ('hike','run','bike','drive','fly','walk','climb','ski')),
  geom geography(linestring, 4326),
  is_validated bool not null default false,
  validation_method text
    check (validation_method in ('gps','photo_exif','manual','strava')),
  visibility text not null default 'public'
    check (visibility in ('public','followers','private')),
  counts_for_bolg bool not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or start_at is null or end_at >= start_at)
);
create trigger trips_touch
  before update on public.trips
  for each row execute function public.touch_updated_at();

-- trip_products ----------------------------------------------------------
create table public.trip_products (
  trip_id uuid references public.trips(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  primary key (trip_id, product_id)
);

-- trip_photos ------------------------------------------------------------
create table public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  url text not null,
  exif_lat double precision,
  exif_lng double precision,
  taken_at timestamptz,
  ordering int not null default 0,
  created_at timestamptz not null default now()
);

-- badges -----------------------------------------------------------------
create table public.badges (
  id text primary key,
  name text not null,
  description text,
  icon_url text,
  rarity text not null default 'common'
    check (rarity in ('common','rare','epic','legendary')),
  created_at timestamptz not null default now()
);

-- user_badges ------------------------------------------------------------
-- Awarded by the system; users don't write here.
create table public.user_badges (
  user_id uuid references public.users(id) on delete cascade,
  badge_id text references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- follows ----------------------------------------------------------------
create table public.follows (
  follower_id uuid references public.users(id) on delete cascade,
  followee_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- likes ------------------------------------------------------------------
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, trip_id)
);

-- comments ---------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger comments_touch
  before update on public.comments
  for each row execute function public.touch_updated_at();

-- expeditions ------------------------------------------------------------
create table public.expeditions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  rules jsonb,
  prize_description text,
  cover_url text,
  created_at timestamptz not null default now()
);

-- expedition_participants ------------------------------------------------
create table public.expedition_participants (
  expedition_id uuid references public.expeditions(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  trips_count int not null default 0 check (trips_count >= 0),
  km_accumulated numeric not null default 0 check (km_accumulated >= 0),
  joined_at timestamptz not null default now(),
  primary key (expedition_id, user_id)
);

-----------------------------------------------------------------------------
-- 4. Indexes (per concepto §9 final + a few obvious additions for joins)
-----------------------------------------------------------------------------
create index trips_user_id_idx on public.trips (user_id);
create index trips_start_at_idx on public.trips (start_at desc);
create index trips_geom_idx on public.trips using gist (geom);
create index trips_country_codes_idx on public.trips using gin (country_codes);
create index trip_products_product_id_idx on public.trip_products (product_id);
create index trip_photos_trip_id_idx on public.trip_photos (trip_id);
create index products_current_owner_id_idx on public.products (current_owner_id);
create index products_model_id_idx on public.products (model_id);
create index product_owners_product_id_idx on public.product_owners (product_id);
create index product_owners_user_id_idx on public.product_owners (user_id);
create index likes_trip_id_idx on public.likes (trip_id);
create index comments_trip_id_idx on public.comments (trip_id);
create index follows_followee_id_idx on public.follows (followee_id);
create index user_badges_user_id_idx on public.user_badges (user_id);
create index expedition_participants_expedition_id_idx
  on public.expedition_participants (expedition_id);

-----------------------------------------------------------------------------
-- 5. Mirror auth.users → public.users on signup
-----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  provisional_username text;
begin
  -- Provisional handle from the auth uuid. The user picks a real one in
  -- onboarding (Sesión 3+).
  provisional_username := 'user_' || lower(replace(substr(new.id::text, 1, 8), '-', ''));
  insert into public.users (id, email, username, display_name)
  values (
    new.id,
    new.email,
    provisional_username,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-----------------------------------------------------------------------------
-- 6. Grants — auto-expose was disabled at project creation; we wire the
--    Data API roles explicitly so PostgREST can see these tables. RLS still
--    governs row-level access on top of these grants.
-----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-----------------------------------------------------------------------------
-- 7. Row Level Security
--    Reads are broadcast-public (this is an outdoor community Atlas, not a
--    private app). Writes are owner-only. Admin tables get no user policy
--    on writes so they fall through to service_role.
-----------------------------------------------------------------------------

-- users ------------------------------------------------------------------
alter table public.users enable row level security;
create policy "users select public"
  on public.users for select using (true);
create policy "users update own"
  on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users delete own"
  on public.users for delete using (auth.uid() = id);
-- INSERT happens via the auth.users trigger; no policy needed.

-- product_models ---------------------------------------------------------
alter table public.product_models enable row level security;
create policy "product_models select public"
  on public.product_models for select using (true);
-- All writes via service_role.

-- products ---------------------------------------------------------------
alter table public.products enable row level security;
create policy "products select public"
  on public.products for select using (true);
create policy "products update by owner"
  on public.products for update
  using (auth.uid() = current_owner_id)
  with check (auth.uid() = current_owner_id);
-- INSERT/DELETE via service_role.

-- product_owners ---------------------------------------------------------
alter table public.product_owners enable row level security;
create policy "product_owners select public"
  on public.product_owners for select using (true);
create policy "product_owners insert own"
  on public.product_owners for insert with check (auth.uid() = user_id);
create policy "product_owners update own"
  on public.product_owners for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- DELETE via service_role only (heritage history is append-only by design).

-- trips ------------------------------------------------------------------
alter table public.trips enable row level security;
create policy "trips select by visibility"
  on public.trips for select using (
    visibility = 'public'
    or auth.uid() = user_id
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows
        where follower_id = auth.uid() and followee_id = trips.user_id
      )
    )
  );
create policy "trips insert own"
  on public.trips for insert with check (auth.uid() = user_id);
create policy "trips update own"
  on public.trips for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trips delete own"
  on public.trips for delete using (auth.uid() = user_id);

-- trip_products ----------------------------------------------------------
alter table public.trip_products enable row level security;
create policy "trip_products select via trip"
  on public.trip_products for select using (
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
create policy "trip_products manage by trip owner"
  on public.trip_products for all
  using (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );

-- trip_photos ------------------------------------------------------------
alter table public.trip_photos enable row level security;
create policy "trip_photos select via trip"
  on public.trip_photos for select using (
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
create policy "trip_photos manage by trip owner"
  on public.trip_photos for all
  using (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );

-- badges -----------------------------------------------------------------
alter table public.badges enable row level security;
create policy "badges select public"
  on public.badges for select using (true);
-- Writes via service_role.

-- user_badges ------------------------------------------------------------
alter table public.user_badges enable row level security;
create policy "user_badges select public"
  on public.user_badges for select using (true);
-- INSERT/DELETE via service_role (system awards).

-- follows ----------------------------------------------------------------
alter table public.follows enable row level security;
create policy "follows select public"
  on public.follows for select using (true);
create policy "follows insert as self"
  on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows delete as self"
  on public.follows for delete using (auth.uid() = follower_id);

-- likes ------------------------------------------------------------------
alter table public.likes enable row level security;
create policy "likes select public"
  on public.likes for select using (true);
create policy "likes insert as self"
  on public.likes for insert with check (auth.uid() = user_id);
create policy "likes delete as self"
  on public.likes for delete using (auth.uid() = user_id);

-- comments ---------------------------------------------------------------
alter table public.comments enable row level security;
create policy "comments select via trip"
  on public.comments for select using (
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
create policy "comments insert on visible trips"
  on public.comments for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (
          t.visibility = 'public'
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
create policy "comments update own"
  on public.comments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comments delete own or by trip owner"
  on public.comments for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );

-- expeditions ------------------------------------------------------------
alter table public.expeditions enable row level security;
create policy "expeditions select public"
  on public.expeditions for select using (true);
-- Writes via service_role.

-- expedition_participants ------------------------------------------------
alter table public.expedition_participants enable row level security;
create policy "expedition_participants select public"
  on public.expedition_participants for select using (true);
create policy "expedition_participants insert as self"
  on public.expedition_participants for insert with check (auth.uid() = user_id);
create policy "expedition_participants update as self"
  on public.expedition_participants for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expedition_participants delete as self"
  on public.expedition_participants for delete using (auth.uid() = user_id);
