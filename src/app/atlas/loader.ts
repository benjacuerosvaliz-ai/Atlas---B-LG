/**
 * Shared server-side data loader for the immersive Atlas. Both `/` (the
 * landing) and `/atlas` (legacy route) render the same client component,
 * so they need identical initial data.
 */

import { createClient } from "@/lib/supabase/server";
import type { AtlasTrip, TopTraveler } from "./AtlasClient";

const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

export async function loadAtlasData(): Promise<{
  initialTrips: AtlasTrip[];
  topTravelers: TopTraveler[];
  authedUsername: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: tripsRaw }, { data: travelersRaw }] = await Promise.all([
    supabase
      .from("trips")
      .select(
        `id, title, start_short_name, end_short_name, start_place_name, end_place_name,
         distance_km, cover_photo_url, start_lat, start_lng, end_lat, end_lng,
         country_codes, activity_type, user_id, start_at,
         users(username, display_name, avatar_url)`,
      )
      .eq("visibility", "public")
      .order("start_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, username, display_name, avatar_url, total_km")
      .order("total_km", { ascending: false })
      .limit(25),
  ]);

  type TripRowFromDb = {
    id: string;
    title: string | null;
    start_short_name: string | null;
    end_short_name: string | null;
    start_place_name: string | null;
    end_place_name: string | null;
    distance_km: number | null;
    cover_photo_url: string | null;
    start_lat: number | null;
    start_lng: number | null;
    end_lat: number | null;
    end_lng: number | null;
    country_codes: string[] | null;
    activity_type: string | null;
    user_id: string;
    start_at: string | null;
    users: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };

  const initialTrips: AtlasTrip[] = (
    (tripsRaw ?? []) as unknown as TripRowFromDb[]
  ).map((t) => ({
    id: t.id,
    title: t.title,
    startShortName: t.start_short_name,
    endShortName: t.end_short_name,
    startPlaceName: t.start_place_name,
    endPlaceName: t.end_place_name,
    distanceKm: t.distance_km,
    coverPhotoUrl: t.cover_photo_url,
    startLat: t.start_lat,
    startLng: t.start_lng,
    endLat: t.end_lat,
    endLng: t.end_lng,
    countryCodes: t.country_codes ?? [],
    activityType: t.activity_type,
    userId: t.user_id,
    username: t.users?.username ?? null,
    displayName: t.users?.display_name ?? null,
    avatarUrl: t.users?.avatar_url ?? null,
    startAt: t.start_at,
  }));

  // Pick the top 3 with real (non-provisional) usernames AND > 0 km. We
  // over-fetch and filter in Node because filtering provisional usernames
  // server-side requires either a NOT LIKE or a postgres regex, and Supabase
  // makes that awkward — easier to just slice here.
  const topTravelers: TopTraveler[] = (travelersRaw ?? [])
    .filter(
      (u) =>
        typeof u.username === "string" &&
        !PROVISIONAL_USERNAME_RE.test(u.username as string) &&
        ((u.total_km as number | null) ?? 0) > 0,
    )
    .slice(0, 3)
    .map((u) => ({
      id: u.id as string,
      username: u.username as string,
      displayName: (u.display_name as string | null) ?? null,
      avatarUrl: (u.avatar_url as string | null) ?? null,
      totalKm: (u.total_km as number | null) ?? 0,
    }));

  // Surface the authed user's username (if any) so the landing can swap
  // "Ingresar" for "Mi panel" without an extra round-trip on the client.
  let authedUsername: string | null = null;
  if (user) {
    const { data: me } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();
    const u = me?.username as string | null | undefined;
    if (u && !PROVISIONAL_USERNAME_RE.test(u)) {
      authedUsername = u;
    }
  }

  return { initialTrips, topTravelers, authedUsername };
}
