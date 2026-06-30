"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { continentOf, haversineKm } from "@/lib/geo";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { City } from "@/lib/mapbox";
import type { TripFormData } from "./types";

type CreateTripResult = { error: string } | undefined;

/** Sanity check: ningún viaje real entre dos ciudades del planeta supera
 * los 20.075 km (mitad de la circunferencia ecuatorial). Dejamos margen. */
const MAX_TRIP_DISTANCE_KM = 50_000;

/** Cuánto hacia atrás aceptamos viajes. */
const MAX_TRIP_YEARS_BACK = 10;

/**
 * Anti-fraude soft: si origen y destino quedan dentro de este radio
 * (en km) los tratamos como "loop sospechoso" — el viaje se guarda pero
 * con `is_validated=false` y `validation_method='pending_review'` para
 * que un humano lo revise desde /admin/audit. Estos trips NO deberían
 * contar para BØLG-100 hits; el filtro vive en loader.ts (pendiente:
 * agregar `WHERE is_validated = true` cuando esa columna se enchufe
 * al pipeline de hits).
 */
const SAME_PLACE_RADIUS_KM = 1;

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

  // Rate-limit: máx 5 viajes por hora por user. Defensa básica contra
  // spam — se pierde en cold-start, suficiente para frenar bots simples.
  const rl = checkRateLimit(`trip:${user.id}`, 5, 3600);
  if (!rl.allowed) {
    const minutes = Math.max(1, Math.ceil(rl.retryAfterSec / 60));
    return {
      error: `Demasiados viajes en poco tiempo. Espera ${minutes} minutos.`,
    };
  }

  if (!data.originCity) return { error: "Falta la ciudad de origen." };
  if (!data.destinationCity) return { error: "Falta la ciudad de destino." };
  if (!data.month || data.month < 1 || data.month > 12) {
    return { error: "Falta el mes." };
  }
  if (!data.year) return { error: "Falta el año." };

  // --- Validaciones server-side hardening ---
  // El form ya las hace en cliente, pero esto cierra la puerta a payloads
  // crafteados a mano (server actions reciben JSON arbitrario).

  // a) Fecha de inicio no en el futuro. Comparamos a nivel de mes para
  // ser consistentes con el form (solo mes + año, día 1 implícito).
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1; // 1-12
  if (
    data.year > currentYear ||
    (data.year === currentYear && data.month > currentMonth)
  ) {
    return { error: "La fecha del viaje no puede estar en el futuro." };
  }

  // d) Año dentro de [currentYear - 10, currentYear].
  if (data.year < currentYear - MAX_TRIP_YEARS_BACK) {
    return {
      error: `Solo aceptamos viajes desde el año ${currentYear - MAX_TRIP_YEARS_BACK} en adelante.`,
    };
  }

  // c) Coordenadas dentro de rangos válidos. Mapbox devuelve floats
  // razonables, pero si alguien manda payload custom esto lo corta.
  if (!isValidLatLng(data.originCity.latitude, data.originCity.longitude)) {
    return { error: "Las coordenadas de la ciudad de origen no son válidas." };
  }
  if (
    !isValidLatLng(
      data.destinationCity.latitude,
      data.destinationCity.longitude,
    )
  ) {
    return { error: "Las coordenadas de la ciudad de destino no son válidas." };
  }

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

  // b) Sanity check de distancia. La haversine entre dos puntos del globo
  // nunca debiera pasar de ~20.075 km; si supera 50.000 es señal clara de
  // input corrupto (coords mezcladas, ciudad con lat=lng=0, etc).
  if (!Number.isFinite(distanceKm) || distanceKm > MAX_TRIP_DISTANCE_KM) {
    return {
      error: "La distancia calculada es inválida. Revisa las ciudades.",
    };
  }

  // f) Anti-fraude soft: viajes con origen ≈ destino (mismo punto en el
  // mapa) son típicos de farm de hits BØLG — el usuario "viaja" de su
  // casa a su casa para reclamar producto sin moverse. No los bloqueamos
  // (puede ser legítimo: "fui a la esquina con mi parka"), solo los
  // marcamos para review humana. NO deberían contar para BØLG-100;
  // implementar el filtro `is_validated = true` en loader.ts cuando se
  // enchufe al pipeline de hits.
  const isSamePlace = distanceKm <= SAME_PLACE_RADIUS_KM;

  // e) Anti-injection: si vienen claimedModelIds, validamos que TODOS
  // existan en product_models antes de meterlos a las tablas (sino el
  // user_claimed_models queda con IDs falsos y el dashboard explota).
  if (data.claimedModelIds.length > 0) {
    // Dedupe defensivo — el form ya lo hace pero por si acaso.
    const uniqueIds = Array.from(new Set(data.claimedModelIds));
    const { data: foundModels, error: modelsErr } = await supabase
      .from("product_models")
      .select("id")
      .in("id", uniqueIds);
    if (modelsErr) {
      console.error("[createTrip] product_models lookup", modelsErr);
      return { error: "No pudimos validar los productos. Reintenta." };
    }
    if ((foundModels?.length ?? 0) !== uniqueIds.length) {
      return {
        error: "Uno de los productos reclamados ya no existe. Refresca la página.",
      };
    }
  }

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
      is_validated: !isSamePlace,
      validation_method: isSamePlace ? "pending_review" : "manual",
      migrated_to_v2: true,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[createTrip] trip insert failed", insertErr);
    return { error: insertErr?.message ?? "No se pudo crear el viaje." };
  }
  const tripId = inserted.id as string;

  // El trip ya está adentro: invalida el cache del Atlas para que el
  // próximo render de /atlas reconstruya KPIs/mapa/leaderboard.
  // Next 16 exige el segundo arg; "max" = stale-while-revalidate.
  revalidateTag("atlas", "max");

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
 * Validación de coordenadas geográficas. Acepta solo floats finitos en
 * los rangos WGS84 estándar.
 */
function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
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
