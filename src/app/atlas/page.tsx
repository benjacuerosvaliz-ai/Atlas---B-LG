import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AtlasClient, type AtlasTrip, type CatalogEntry } from "./AtlasClient";

export const metadata: Metadata = {
  title: "Atlas — Las olas no se quedan quietas",
  description:
    "Todos los viajes públicos de la comunidad BØLG, en vivo, sobre el globo terráqueo.",
};

export default async function AtlasPage() {
  const supabase = await createClient();

  // Initial snapshot of every public trip with its model tags + author.
  // Realtime kicks in client-side after hydration.
  const [{ data: tripsRaw }, { data: catalogRaw }] = await Promise.all([
    supabase
      .from("trips")
      .select(
        `id, title, start_short_name, end_short_name, start_place_name, end_place_name,
         distance_km, cover_photo_url, start_lat, start_lng, end_lat, end_lng,
         country_codes, activity_type, user_id, start_at,
         trip_claimed_models(model_id),
         users(username, display_name)`,
      )
      .eq("visibility", "public")
      .order("start_at", { ascending: false }),
    supabase
      .from("product_models")
      .select("id, name, category")
      .order("name"),
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
    trip_claimed_models: { model_id: string }[] | null;
    users: { username: string; display_name: string | null } | null;
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
    modelIds: (t.trip_claimed_models ?? []).map((c) => c.model_id),
  }));

  const catalog: CatalogEntry[] = (catalogRaw ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    category: (c.category as string | null) ?? null,
  }));

  return <AtlasClient initialTrips={initialTrips} catalog={catalog} />;
}
