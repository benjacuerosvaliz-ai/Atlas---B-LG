"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { continentOf, haversineKm } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";
import type { City } from "@/lib/mapbox";
import type { TripFormData } from "./types";

type CreateTripResult = { error: string } | undefined;

/**
 * Crea un viaje v2:
 * 1. Upsert ciudades origen + destino en public.cities (dedupe por mapbox_id).
 * 2. Inserta trip con fecha YYYY-MM-01, distancia auto-haversine.
 * 3. Inserta 2 city_visits con bolg_visible = (≥1 producto reclamado).
 * 4. Inserta trip_claimed_models + upserts user_claimed_models.
 */
export async function createTrip(data: TripFormData): Promise<CreateTripResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu sesión expiró. Vuelve a entrar." };
  if (!data.originCity) return { error: "Falta la ciudad de origen." };
  if (!data.destinationCity) return { error: "Falta la ciudad de destino." };
  if (!data.month || data.month < 1 || data.month > 12) {
    return { error: "Falta el mes." };
  }
  if (!data.year) return { error: "Falta el año." };

  // Date: usamos el día 1 del mes seleccionado para mantener compat con
  // trips.start_at que es DATE NOT NULL.
  const startAt = `${data.year}-${String(data.month).padStart(2, "0")}-01`;

  // Distancia auto-calculada (haversine) entre las 2 ciudades.
  const distanceKm = haversineKm(
    data.originCity.latitude,
    data.originCity.longitude,
    data.destinationCity.latitude,
    data.destinationCity.longitude,
  );

  const bolgVisible = data.claimedModelIds.length > 0;

  // --- Paso 1: upsert cities ---
  // Hacemos una sola query con ON CONFLICT (mapbox_id) DO NOTHING via
  // upsert() + select para recuperar el id final.
  const originCityRow = await ensureCity(supabase, data.originCity);
  if ("error" in originCityRow) return originCityRow;
  const destCityRow = await ensureCity(supabase, data.destinationCity);
  if ("error" in destCityRow) return destCityRow;

  const countryCodes = Array.from(
    new Set(
      [data.originCity.countryCode, data.destinationCity.countryCode].filter(
        Boolean,
      ),
    ),
  );

  // --- Paso 2: insert trip ---
  const { data: inserted, error: insertErr } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      title: null,
      description: null,
      cover_photo_url: data.photo?.url ?? null,
      start_at: startAt,
      end_at: null,
      distance_km: Math.round(distanceKm * 10) / 10,
      elevation_gain_m: null,
      start_lat: data.originCity.latitude,
      start_lng: data.originCity.longitude,
      end_lat: data.destinationCity.latitude,
      end_lng: data.destinationCity.longitude,
      start_place_name: data.originCity.placeFormatted,
      end_place_name: data.destinationCity.placeFormatted,
      start_short_name: data.originCity.name,
      end_short_name: data.destinationCity.name,
      country_codes: countryCodes.length > 0 ? countryCodes : null,
      activity_type: "drive",
      visibility: "public",
      counts_for_bolg: bolgVisible,
      is_validated: true,
      validation_method: "manual",
      migrated_to_v2: true,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[createTrip] trip insert failed", insertErr);
    return { error: insertErr?.message ?? "No se pudo crear el viaje." };
  }
  const tripId = inserted.id as string;

  // --- Paso 3: city_visits ---
  // Si origen == destino (misma ciudad) insertamos UNA sola visita, no dos
  // duplicadas. Comparamos por id local — ya están deduped por mapbox_id.
  const sameCity = originCityRow.id === destCityRow.id;
  const visitedDate = startAt;
  const visitsPayload = sameCity
    ? [
        {
          user_id: user.id,
          city_id: originCityRow.id,
          trip_id: tripId,
          bolg_visible: bolgVisible,
          visited_at: visitedDate,
        },
      ]
    : [
        {
          user_id: user.id,
          city_id: originCityRow.id,
          trip_id: tripId,
          bolg_visible: bolgVisible,
          visited_at: visitedDate,
        },
        {
          user_id: user.id,
          city_id: destCityRow.id,
          trip_id: tripId,
          bolg_visible: bolgVisible,
          visited_at: visitedDate,
        },
      ];
  const { error: visitsErr } = await supabase
    .from("city_visits")
    .insert(visitsPayload);
  if (visitsErr) {
    console.error("[createTrip] city_visits insert", visitsErr);
    return { error: visitsErr.message };
  }

  // --- Paso 4: foto ---
  // Warning, no aborta. Pero si la foto era obligatoria para celebración
  // y falla, marcamos para suprimir la celebración.
  let photoFailed = false;
  if (data.photo) {
    const { error: photoErr } = await supabase.from("trip_photos").insert({
      trip_id: tripId,
      url: data.photo.url,
      ordering: 0,
    });
    if (photoErr) {
      console.error("[createTrip] trip_photos", photoErr);
      photoFailed = true;
    }
  }

  // --- Paso 5: productos reclamados ---
  // Warning, no aborta. Si falló todo el reclamo, suprimimos la celebración.
  let claimsFailed = false;
  if (data.claimedModelIds.length > 0) {
    const { error: tripClaimErr } = await supabase
      .from("trip_claimed_models")
      .insert(
        data.claimedModelIds.map((modelId) => ({
          trip_id: tripId,
          model_id: modelId,
        })),
      );
    if (tripClaimErr) {
      console.error("[createTrip] trip_claimed_models", tripClaimErr);
      claimsFailed = true;
    }

    const { error: collectionErr } = await supabase
      .from("user_claimed_models")
      .upsert(
        data.claimedModelIds.map((modelId) => ({
          user_id: user.id,
          model_id: modelId,
        })),
        { onConflict: "user_id,model_id", ignoreDuplicates: true },
      );
    if (collectionErr) {
      console.error("[createTrip] user_claimed_models", collectionErr);
      claimsFailed = true;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/");

  // --- Paso 6: stats post-conquista para la pantalla de celebración ---
  // Cuántas ciudades y países distintos sumó este viaje al usuario.
  // Si bolg_visible=true, también chequeamos si fue el primer conquistador
  // BØLG de la ciudad destino.
  const { data: myVisits } = await supabase
    .from("city_visits")
    .select("city_id, cities(country_code)")
    .eq("user_id", user.id);

  type V = { city_id: string; cities: { country_code: string | null } | null };
  const myAllVisits = (myVisits ?? []) as unknown as V[];
  const previousCities = new Set<string>();
  const previousCountries = new Set<string>();
  for (const v of myAllVisits) {
    if (v.city_id === originCityRow.id || v.city_id === destCityRow.id) continue;
    previousCities.add(v.city_id);
    if (v.cities?.country_code) previousCountries.add(v.cities.country_code);
  }
  // Si origen == destino contamos solo una ciudad nueva (no dos veces la
  // misma). Lo mismo para país.
  const newCities = sameCity
    ? previousCities.has(originCityRow.id)
      ? 0
      : 1
    : (previousCities.has(originCityRow.id) ? 0 : 1) +
      (previousCities.has(destCityRow.id) ? 0 : 1);
  const newCountriesSet = new Set<string>();
  if (data.originCity.countryCode && !previousCountries.has(data.originCity.countryCode))
    newCountriesSet.add(data.originCity.countryCode);
  if (
    !sameCity &&
    data.destinationCity.countryCode &&
    !previousCountries.has(data.destinationCity.countryCode)
  )
    newCountriesSet.add(data.destinationCity.countryCode);

  // Primer conquistador BØLG del DESTINO (no del origen — el destino es la
  // ciudad protagonista del viaje). Solo aplica si bolg_visible=true.
  let firstBolg = false;
  if (bolgVisible) {
    const { count: priorBolgConquerors } = await supabase
      .from("city_visits")
      .select("id", { count: "exact", head: true })
      .eq("city_id", destCityRow.id)
      .eq("bolg_visible", true)
      .neq("trip_id", tripId);
    firstBolg = (priorBolgConquerors ?? 0) === 0;
  }

  // Si la foto Y los reclamos fallaron (cuando el usuario los subió),
  // no mostramos celebración: lo importante para ese flow se perdió.
  // El viaje en sí quedó guardado.
  const hadPhotoOrClaims =
    Boolean(data.photo) || data.claimedModelIds.length > 0;
  const allExtrasFailed =
    hadPhotoOrClaims &&
    (!data.photo || photoFailed) &&
    (data.claimedModelIds.length === 0 || claimsFailed);

  const params = new URLSearchParams();
  if (!allExtrasFailed) {
    params.set("conquistado", "1");
    params.set("newCities", String(newCities));
    params.set("newCountries", String(newCountriesSet.size));
    if (firstBolg) params.set("firstBolg", "1");
  }
  const qs = params.toString();
  redirect(qs ? `/t/${tripId}?${qs}` : `/t/${tripId}`);
}

/**
 * Upsert una ciudad en public.cities indexada por mapbox_id. Devuelve el
 * id local de la ciudad. Si el continente de la ciudad no está en nuestro
 * mapa estático (lib/geo) devolvemos error — significa que el countryCode
 * no es ISO o no lo conocemos.
 */
async function ensureCity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  city: City,
): Promise<{ id: string } | { error: string }> {
  // Caso feliz: la ciudad ya existe.
  const { data: existing } = await supabase
    .from("cities")
    .select("id")
    .eq("mapbox_id", city.mapboxId)
    .maybeSingle();
  if (existing?.id) return { id: existing.id as string };

  const continent = continentOf(city.countryCode);
  if (!continent) {
    return {
      error: `No reconocemos el país "${city.country}" (${city.countryCode}). Avísanos para agregarlo.`,
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
    // Carrera: dos usuarios insertan la misma ciudad al mismo tiempo. El
    // segundo se gana el unique violation. Re-lookup.
    if (error?.code === "23505") {
      const { data: retry } = await supabase
        .from("cities")
        .select("id")
        .eq("mapbox_id", city.mapboxId)
        .single();
      if (retry?.id) return { id: retry.id as string };
    }
    console.error("[ensureCity]", error);
    return { error: "No pudimos registrar la ciudad. Reintenta." };
  }
  return { id: created.id as string };
}
