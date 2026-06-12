"use server";

import { revalidatePath } from "next/cache";
import { continentOf } from "@/lib/geo";
import type { City } from "@/lib/mapbox";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = new Set([
  "benja.bolgen@gmail.com",
  "benja.cuerosvaliz@gmail.com",
]);

type MigrateInput = {
  tripId: string;
  originCity: City;
  destinationCity: City;
};

type Result = { error: string } | undefined;

export async function migrateTrip(input: MigrateInput): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.has(user.email ?? "")) {
    return { error: "No autorizado." };
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id, user_id, start_at, created_at, counts_for_bolg, migrated_to_v2")
    .eq("id", input.tripId)
    .single();

  if (!trip) return { error: "Viaje no encontrado." };
  if (trip.migrated_to_v2) return { error: "Ya estaba migrado." };

  const originRow = await ensureCity(supabase, input.originCity);
  if ("error" in originRow) return originRow;
  const destRow = await ensureCity(supabase, input.destinationCity);
  if ("error" in destRow) return destRow;

  const bolg = Boolean(trip.counts_for_bolg);
  const uploadedAt =
    (trip.created_at as string | null) ?? new Date().toISOString();
  const visitedAt = (trip.start_at as string | null) ?? null;

  const { error: visitsErr } = await supabase.from("city_visits").insert([
    {
      user_id: trip.user_id,
      city_id: originRow.id,
      trip_id: trip.id,
      bolg_visible: bolg,
      uploaded_at: uploadedAt,
      visited_at: visitedAt,
    },
    {
      user_id: trip.user_id,
      city_id: destRow.id,
      trip_id: trip.id,
      bolg_visible: bolg,
      uploaded_at: uploadedAt,
      visited_at: visitedAt,
    },
  ]);
  if (visitsErr) return { error: visitsErr.message };

  const { error: flagErr } = await supabase
    .from("trips")
    .update({ migrated_to_v2: true })
    .eq("id", trip.id);
  if (flagErr) return { error: flagErr.message };

  revalidatePath("/admin/migrar-viajes");
  revalidatePath("/");
  return undefined;
}

export async function skipTrip(tripId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.has(user.email ?? "")) {
    return { error: "No autorizado." };
  }
  // Skip = solo marcamos migrated_to_v2 = true para sacarlo de la cola, sin
  // crear city_visits. El trip queda visible pero no cuenta para conquista.
  const { error } = await supabase
    .from("trips")
    .update({ migrated_to_v2: true })
    .eq("id", tripId);
  if (error) return { error: error.message };
  revalidatePath("/admin/migrar-viajes");
  return undefined;
}

async function ensureCity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  city: City,
): Promise<{ id: string } | { error: string }> {
  const { data: existing } = await supabase
    .from("cities")
    .select("id")
    .eq("mapbox_id", city.mapboxId)
    .maybeSingle();
  if (existing?.id) return { id: existing.id as string };

  const continent = continentOf(city.countryCode);
  if (!continent) {
    return {
      error: `País desconocido (${city.countryCode}). Agregar a lib/geo.`,
    };
  }

  const { data: created, error } = await supabase
    .from("cities")
    .insert({
      mapbox_id: city.mapboxId,
      name: city.name,
      country_code: city.countryCode,
      continent_code: continent,
      latitude: city.latitude,
      longitude: city.longitude,
    })
    .select("id")
    .single();

  if (error || !created) {
    if (error?.code === "23505") {
      const { data: retry } = await supabase
        .from("cities")
        .select("id")
        .eq("mapbox_id", city.mapboxId)
        .single();
      if (retry?.id) return { id: retry.id as string };
    }
    return { error: "No se pudo crear la ciudad." };
  }
  return { id: created.id as string };
}
