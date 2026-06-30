/**
 * Loader del Atlas v2. Trae:
 *  - 4 KPIs globales (km comunidad, ciudades, países, continentes).
 *  - Si hay usuario autenticado, también sus 4 KPIs personales.
 *  - country_status_global → para colorear el mapa en modo Global.
 *  - user_country_status(user) → para colorear el mapa en modo Personal.
 *  - Top 3 viajeros por cities_conquered (con fallback a users.total_km
 *    para tener algo que mostrar mientras la comunidad aún no tiene
 *    city_visits).
 *
 * Caching: la parte global (sin user) está envuelta en `unstable_cache`
 * con revalidate 60s + tag "atlas". La parte personal se calcula por
 * request porque depende de user.id y RLS por sesión.
 */

import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { BOLG_100, matchBolg100, type Bolg100Destination } from "@/lib/bolg-100";
import { COUNTRY_TO_CONTINENT } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";

const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

export type CountryStatus = "complete" | "partial" | "none";

export type Kpis = {
  totalKm: number;
  citiesVisited: number;
  countriesRecorridos: number;
  continentsConocidos: number;
  bolg100Hit: number; // cuántos de los 100 destinos BØLG fueron tocados
};

export type Bolg100Status = Bolg100Destination & {
  touched: boolean;       // alguien en la comunidad ya lo pisó
  touchedByMe: boolean;   // el usuario actual lo pisó
  bolgVisibleHit: boolean; // alguien lo pisó con producto BØLG
};

export type TopTraveler = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  citiesConquered: number;
  totalKm: number;
};

export type ActivityEvent = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  cityName: string;
  countryCode: string;
  bolgVisible: boolean;
  at: string; // ISO
};

export type ConqueredCity = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  countryCode: string;
  bolgVisible: boolean;
  conquerorUsername: string | null;
  conquerorDisplayName: string | null;
  conquerorAvatarUrl: string | null;
};

export type Totals = {
  cities: number;     // ciudades registradas en la comunidad (denominador dinámico)
  countries: number;  // países que reconocemos en lib/geo
  continents: number; // 7
  bolg100: number;    // 100 destinos BØLG curados
};

export type AtlasGlobalData = {
  globalKpis: Kpis;
  totals: Totals;
  statusByCountryGlobal: Record<string, CountryStatus>;
  topTravelers: TopTraveler[];
  recentActivity: ActivityEvent[];
  conqueredCities: ConqueredCity[];
  // Set serializado como array para que unstable_cache lo pueda persistir.
  globalBolg100Ids: string[];
  bolg100BolgVisibleIds: string[];
};

export type AtlasPersonalData = {
  authedUsername: string | null;
  personalKpis: Kpis | null;
  statusByCountryPersonal: Record<string, CountryStatus> | null;
  // Coordenadas de las visitas del usuario — necesarias para calcular
  // touchedByMe sobre el catálogo BØLG-100 al combinar con la data global.
  personalCoords: Array<{ lat: number; lng: number }>;
};

/**
 * Cliente Supabase anónimo, SIN cookies. Necesario dentro de
 * `unstable_cache` porque `headers()`/`cookies()` están prohibidos en
 * scopes cacheados. Las queries globales solo leen tablas/vistas con
 * políticas `*_public_read`, así que un anon key alcanza.
 */
function createCachedClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

async function loadAtlasGlobalUncached(): Promise<AtlasGlobalData> {
  const supabase = createCachedClient();

  const [
    { data: tripsKmRows },
    { data: visitsGlobal },
    { data: globalCountryStatus },
    { count: totalCities },
    { data: topRaw },
    { data: activityRaw },
    { data: conquerorsRaw },
  ] = await Promise.all([
    supabase.from("trips").select("distance_km").eq("visibility", "public"),
    supabase
      .from("city_visits")
      .select("city_id, cities(country_code, continent_code)"),
    supabase.from("country_status_global").select("country_code, status"),
    supabase.from("cities").select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id, username, display_name, avatar_url, total_km")
      .order("total_km", { ascending: false })
      .limit(25),
    supabase
      .from("city_visits")
      .select(
        "uploaded_at, bolg_visible, cities(name, country_code), users(username, display_name, avatar_url)",
      )
      .order("uploaded_at", { ascending: false })
      .limit(12),
    // Conquistadores actuales por ciudad — base para los pins del mapa.
    // (cities/users se resuelven aparte porque city_conquerors es una view
    // y PostgREST no detecta FKs sobre views.)
    supabase
      .from("city_conquerors")
      .select("city_id, conqueror_id, bolg_visible"),
  ]);

  const totals: Totals = {
    cities: totalCities ?? 0,
    countries: Object.keys(COUNTRY_TO_CONTINENT).length,
    continents: 7,
    bolg100: BOLG_100.length,
  };

  // Global KPIs
  const totalKmGlobal = Math.round(
    (tripsKmRows ?? []).reduce(
      (acc, r) => acc + ((r.distance_km as number | null) ?? 0),
      0,
    ),
  );
  const globalCities = new Set<string>();
  const globalCountries = new Set<string>();
  const globalContinents = new Set<string>();
  for (const v of visitsGlobal ?? []) {
    globalCities.add(v.city_id as string);
    const c = (
      v.cities as unknown as
        | { country_code?: string; continent_code?: string }
        | null
    ) ?? null;
    if (c?.country_code) globalCountries.add(c.country_code);
    if (c?.continent_code) globalContinents.add(c.continent_code);
  }
  const globalKpis: Kpis = {
    totalKm: totalKmGlobal,
    citiesVisited: globalCities.size,
    countriesRecorridos: globalCountries.size,
    continentsConocidos: globalContinents.size,
    bolg100Hit: 0, // se setea más abajo
  };

  const statusByCountryGlobal: Record<string, CountryStatus> = {};
  for (const r of (globalCountryStatus as Array<{ country_code: string; status: string }> | null) ?? []) {
    statusByCountryGlobal[r.country_code] = r.status as CountryStatus;
  }

  // Top travelers — todavía usamos users.total_km como proxy mientras la
  // comunidad sube city_visits. Una vez con data, cambiamos a sort por
  // cities_conquered.
  const topTravelers: TopTraveler[] = (topRaw ?? [])
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
      citiesConquered: 0, // TODO: join cuando user_conquest_stats tenga rows
      totalKm: (u.total_km as number | null) ?? 0,
    }));

  // Mapear actividad reciente — descartamos usuarios provisionales y rows
  // sin city o sin user (huérfanos).
  type RawActivity = {
    uploaded_at: string;
    bolg_visible: boolean;
    cities: { name: string | null; country_code: string | null } | null;
    users: {
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  const recentActivity: ActivityEvent[] = ((activityRaw ?? []) as unknown as RawActivity[])
    .filter(
      (r) =>
        r.users?.username &&
        !PROVISIONAL_USERNAME_RE.test(r.users.username) &&
        r.cities?.name &&
        r.cities?.country_code,
    )
    .slice(0, 8)
    .map((r) => ({
      username: r.users!.username!,
      displayName: r.users?.display_name ?? null,
      avatarUrl: r.users?.avatar_url ?? null,
      cityName: r.cities!.name!,
      countryCode: r.cities!.country_code!,
      bolgVisible: !!r.bolg_visible,
      at: r.uploaded_at,
    }));

  // Resolver pins por ciudad: city_conquerors es una view, así que
  // hidratamos cities y users con dos queries en paralelo por id.
  type RawConqueror = {
    city_id: string;
    conqueror_id: string;
    bolg_visible: boolean | null;
  };
  const conquerors: RawConqueror[] =
    ((conquerorsRaw ?? []) as unknown as RawConqueror[]).filter(
      (r) => r.city_id && r.conqueror_id,
    );

  let conqueredCities: ConqueredCity[] = [];
  if (conquerors.length > 0) {
    const cityIds = Array.from(new Set(conquerors.map((r) => r.city_id)));
    const userIds = Array.from(new Set(conquerors.map((r) => r.conqueror_id)));

    const [
      { data: cityRows },
      { data: userRows },
    ] = await Promise.all([
      supabase
        .from("cities")
        .select("id, name, country_code, latitude, longitude")
        .in("id", cityIds),
      supabase
        .from("users")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds),
    ]);

    type CityRow = {
      id: string;
      name: string | null;
      country_code: string | null;
      latitude: number | string | null;
      longitude: number | string | null;
    };
    type UserRow = {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    };
    const cityById = new Map<string, CityRow>();
    for (const c of ((cityRows ?? []) as unknown as CityRow[])) {
      cityById.set(c.id, c);
    }
    const userById = new Map<string, UserRow>();
    for (const u of ((userRows ?? []) as unknown as UserRow[])) {
      userById.set(u.id, u);
    }

    conqueredCities = conquerors
      .map((row) => {
        const city = cityById.get(row.city_id);
        const userRow = userById.get(row.conqueror_id);
        if (!city || !city.name || !city.country_code) return null;
        const lat = typeof city.latitude === "string"
          ? Number.parseFloat(city.latitude)
          : city.latitude;
        const lng = typeof city.longitude === "string"
          ? Number.parseFloat(city.longitude)
          : city.longitude;
        if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
          return null;
        }
        const username = userRow?.username ?? null;
        // Ocultamos usernames provisionales del UI público (los pins se
        // siguen mostrando, pero sin nombre del conquistador).
        const cleanUsername =
          username && !PROVISIONAL_USERNAME_RE.test(username) ? username : null;
        return {
          id: city.id,
          name: city.name,
          latitude: lat,
          longitude: lng,
          countryCode: city.country_code,
          bolgVisible: !!row.bolg_visible,
          conquerorUsername: cleanUsername,
          conquerorDisplayName: userRow?.display_name ?? null,
          conquerorAvatarUrl: userRow?.avatar_url ?? null,
        } satisfies ConqueredCity;
      })
      .filter((c): c is ConqueredCity => c !== null);
  }

  // BØLG-100: hits globales y bolg-visible hits.
  const globalBolg100Set = new Set<string>();
  const bolg100BolgVisibleSet = new Set<string>();
  for (const c of conqueredCities) {
    const m = matchBolg100(c.latitude, c.longitude);
    if (!m) continue;
    globalBolg100Set.add(m.id);
    if (c.bolgVisible) bolg100BolgVisibleSet.add(m.id);
  }
  globalKpis.bolg100Hit = globalBolg100Set.size;

  return {
    globalKpis,
    totals,
    statusByCountryGlobal,
    topTravelers,
    recentActivity,
    conqueredCities,
    globalBolg100Ids: Array.from(globalBolg100Set),
    bolg100BolgVisibleIds: Array.from(bolg100BolgVisibleSet),
  };
}

/**
 * Versión cacheada (60s, tag "atlas") de la data global del Atlas.
 * Llamar `revalidateTag("atlas")` después de mutar trips/visits para
 * forzar refresco.
 */
export const loadAtlasGlobalCached = unstable_cache(
  loadAtlasGlobalUncached,
  ["atlas-global-v1"],
  {
    revalidate: 60,
    tags: ["atlas"],
  },
);

/**
 * Data personal del usuario autenticado. NO cacheada (cambia por user.id
 * y se actualiza apenas el usuario sube un viaje propio).
 */
async function loadAtlasPersonal(): Promise<AtlasPersonalData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authedUsername: null,
      personalKpis: null,
      statusByCountryPersonal: null,
      personalCoords: [],
    };
  }

  const [
    { data: myTripsKm },
    { data: myVisits },
    { data: myCountryStatus },
    profileRes,
  ] = await Promise.all([
    supabase.from("trips").select("distance_km").eq("user_id", user.id),
    supabase
      .from("city_visits")
      .select(
        "city_id, cities(country_code, continent_code, latitude, longitude)",
      )
      .eq("user_id", user.id),
    supabase.rpc("user_country_status", { p_user_id: user.id }),
    supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single(),
  ]);

  const authedUsername =
    (profileRes.data?.username as string | null) ?? null;

  const myKm = Math.round(
    (myTripsKm ?? []).reduce(
      (acc, r) => acc + ((r.distance_km as number | null) ?? 0),
      0,
    ),
  );
  const myCities = new Set<string>();
  const myCountries = new Set<string>();
  const myContinents = new Set<string>();
  type MyVisitCity = {
    country_code?: string | null;
    continent_code?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
  };
  const myCoords: Array<{ lat: number; lng: number }> = [];
  for (const v of myVisits ?? []) {
    myCities.add(v.city_id as string);
    const c = (v.cities as unknown as MyVisitCity | null) ?? null;
    if (c?.country_code) myCountries.add(c.country_code);
    if (c?.continent_code) myContinents.add(c.continent_code);
    if (c?.latitude != null && c?.longitude != null) {
      const lat = typeof c.latitude === "string"
        ? Number.parseFloat(c.latitude)
        : c.latitude;
      const lng = typeof c.longitude === "string"
        ? Number.parseFloat(c.longitude)
        : c.longitude;
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        myCoords.push({ lat, lng });
      }
    }
  }
  // Conteo de hits BØLG-100 personales (unique destinos tocados por mí).
  const myBolg100Set = new Set<string>();
  for (const { lat, lng } of myCoords) {
    const m = matchBolg100(lat, lng);
    if (m) myBolg100Set.add(m.id);
  }

  const personalKpis: Kpis = {
    totalKm: myKm,
    citiesVisited: myCities.size,
    countriesRecorridos: myCountries.size,
    continentsConocidos: myContinents.size,
    bolg100Hit: myBolg100Set.size,
  };

  const statusByCountryPersonal: Record<string, CountryStatus> = {};
  for (const r of (myCountryStatus as Array<{ country_code: string; status: string }> | null) ?? []) {
    statusByCountryPersonal[r.country_code] = r.status as CountryStatus;
  }

  return {
    authedUsername,
    personalKpis,
    statusByCountryPersonal,
    personalCoords: myCoords,
  };
}

export async function loadAtlasV2Data(): Promise<{
  authedUsername: string | null;
  globalKpis: Kpis;
  personalKpis: Kpis | null;
  totals: Totals;
  statusByCountryGlobal: Record<string, CountryStatus>;
  statusByCountryPersonal: Record<string, CountryStatus> | null;
  topTravelers: TopTraveler[];
  recentActivity: ActivityEvent[];
  conqueredCities: ConqueredCity[];
  bolg100Status: Bolg100Status[];
}> {
  // Global (cacheado 60s) + personal (por request) en paralelo.
  const [globalData, personalData] = await Promise.all([
    loadAtlasGlobalCached(),
    loadAtlasPersonal(),
  ]);

  const globalBolg100Set = new Set(globalData.globalBolg100Ids);
  const bolg100BolgVisibleSet = new Set(globalData.bolg100BolgVisibleIds);

  // Re-derivar set personal desde coords cacheadas en `personalData`.
  const myBolg100Set = new Set<string>();
  for (const { lat, lng } of personalData.personalCoords) {
    const m = matchBolg100(lat, lng);
    if (m) myBolg100Set.add(m.id);
  }

  const bolg100Status: Bolg100Status[] = BOLG_100.map((d) => ({
    ...d,
    touched: globalBolg100Set.has(d.id),
    touchedByMe: myBolg100Set.has(d.id),
    bolgVisibleHit: bolg100BolgVisibleSet.has(d.id),
  }));

  return {
    authedUsername: personalData.authedUsername,
    globalKpis: globalData.globalKpis,
    personalKpis: personalData.personalKpis,
    totals: globalData.totals,
    statusByCountryGlobal: globalData.statusByCountryGlobal,
    statusByCountryPersonal: personalData.statusByCountryPersonal,
    topTravelers: globalData.topTravelers,
    recentActivity: globalData.recentActivity,
    conqueredCities: globalData.conqueredCities,
    bolg100Status,
  };
}
