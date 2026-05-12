"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TripFormData } from "./types";

type CreateTripResult = { error: string } | undefined;

export async function createTrip(data: TripFormData): Promise<CreateTripResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu sesión expiró. Volvé a entrar." };

  // Server-side re-validation. Never trust the client wizard alone.
  if (!data.startPlace) return { error: "Falta el lugar de inicio." };
  if (!data.startAt) return { error: "Falta la fecha de inicio." };
  if (!data.activityType) return { error: "Elegí un tipo de actividad." };
  if (typeof data.distanceKm !== "number" || data.distanceKm < 0) {
    return { error: "Distancia inválida." };
  }
  if (data.endAt && data.startAt && data.endAt < data.startAt) {
    return { error: "La fecha de fin no puede ser anterior a la de inicio." };
  }

  // Aggregate country codes from start + end (if present), unique.
  const countryCodes = Array.from(
    new Set(
      [data.startPlace.countryCode, data.endPlace?.countryCode].filter(
        (c): c is string => Boolean(c),
      ),
    ),
  );

  // geom (PostGIS LineString) is left NULL for manually-entered trips. We
  // populate it in Sesión 4-5 once GPS imports land — for now distance_km
  // is the canonical metric.

  const { data: inserted, error: insertErr } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      title: data.title ?? null,
      description: data.description ?? null,
      cover_photo_url: data.photos[0]?.url ?? null,
      start_at: data.startAt,
      end_at: data.endAt ?? null,
      distance_km: data.distanceKm,
      elevation_gain_m: data.elevationGainM ?? null,
      start_lat: data.startPlace.latitude,
      start_lng: data.startPlace.longitude,
      end_lat: data.endPlace?.latitude ?? null,
      end_lng: data.endPlace?.longitude ?? null,
      start_place_name: data.startPlace.placeFormatted,
      end_place_name: data.endPlace?.placeFormatted ?? null,
      country_codes: countryCodes.length > 0 ? countryCodes : null,
      activity_type: data.activityType,
      visibility: "public",
      counts_for_bolg: data.productIds.length > 0,
      is_validated: true,
      validation_method: "manual",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[createTrip] trip insert failed", insertErr);
    return { error: insertErr?.message ?? "No se pudo crear el viaje." };
  }

  const tripId = inserted.id as string;

  if (data.photos.length > 0) {
    const { error: photoErr } = await supabase.from("trip_photos").insert(
      data.photos.map((p, i) => ({
        trip_id: tripId,
        url: p.url,
        ordering: i,
      })),
    );
    if (photoErr) console.error("[createTrip] trip_photos", photoErr);
  }

  if (data.productIds.length > 0) {
    const { error: prodErr } = await supabase.from("trip_products").insert(
      data.productIds.map((pid) => ({
        trip_id: tripId,
        product_id: pid,
      })),
    );
    if (prodErr) console.error("[createTrip] trip_products", prodErr);
  }

  revalidatePath("/dashboard");
  redirect(`/t/${tripId}`);
}
