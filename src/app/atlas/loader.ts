/**
 * Loader del Atlas v2. Trae:
 *  - 4 KPIs globales (km comunidad, ciudades, países, continentes).
 *  - Si hay usuario autenticado, también sus 4 KPIs personales.
 *  - country_status_global → para colorear el mapa en modo Global.
 *  - user_country_status(user) → para colorear el mapa en modo Personal.
 *  - Top 3 viajeros por cities_conquered (con fallback a users.total_km
 *    para tener algo que mostrar mientras la comunidad aún no tiene
 *    city_visits).
 */

import { COUNTRY_TO_CONTINENT } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";

const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

export type CountryStatus = "complete" | "partial" | "none";

export type Kpis = {
  totalKm: number;
  citiesVisited: number;
  countriesRecorridos: number;
  continentsConocidos: number;
};

export type TopTraveler = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  citiesConquered: number;
  totalKm: number;
};

export type Totals = {
  cities: number;     // ciudades registradas en la comunidad (denominador dinámico)
  countries: number;  // países que reconocemos en lib/geo
  continents: number; // 7
};

export async function loadAtlasV2Data(): Promise<{
  authedUsername: string | null;
  globalKpis: Kpis;
  personalKpis: Kpis | null;
  totals: Totals;
  statusByCountryGlobal: Record<string, CountryStatus>;
  statusByCountryPersonal: Record<string, CountryStatus> | null;
  topTravelers: TopTraveler[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Run independent queries in parallel.
  const [
    { data: tripsKmRows },
    { data: visitsGlobal },
    { data: globalCountryStatus },
    { count: totalCities },
    { data: topRaw },
    personalUsername,
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
    user
      ? supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single()
          .then(({ data }) => (data?.username as string | null) ?? null)
      : Promise.resolve(null),
  ]);

  const totals: Totals = {
    cities: totalCities ?? 0,
    countries: Object.keys(COUNTRY_TO_CONTINENT).length,
    continents: 7,
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
  };

  // Personal KPIs + country status (only if authed)
  let personalKpis: Kpis | null = null;
  let statusByCountryPersonal: Record<string, CountryStatus> | null = null;
  if (user) {
    const [
      { data: myTripsKm },
      { data: myVisits },
      { data: myCountryStatus },
    ] = await Promise.all([
      supabase.from("trips").select("distance_km").eq("user_id", user.id),
      supabase
        .from("city_visits")
        .select("city_id, cities(country_code, continent_code)")
        .eq("user_id", user.id),
      supabase.rpc("user_country_status", { p_user_id: user.id }),
    ]);

    const myKm = Math.round(
      (myTripsKm ?? []).reduce(
        (acc, r) => acc + ((r.distance_km as number | null) ?? 0),
        0,
      ),
    );
    const myCities = new Set<string>();
    const myCountries = new Set<string>();
    const myContinents = new Set<string>();
    for (const v of myVisits ?? []) {
      myCities.add(v.city_id as string);
      const c = (
        v.cities as unknown as
          | { country_code?: string; continent_code?: string }
          | null
      ) ?? null;
      if (c?.country_code) myCountries.add(c.country_code);
      if (c?.continent_code) myContinents.add(c.continent_code);
    }
    personalKpis = {
      totalKm: myKm,
      citiesVisited: myCities.size,
      countriesRecorridos: myCountries.size,
      continentsConocidos: myContinents.size,
    };
    statusByCountryPersonal = {};
    for (const r of (myCountryStatus as Array<{ country_code: string; status: string }> | null) ?? []) {
      statusByCountryPersonal[r.country_code] = r.status as CountryStatus;
    }
  }

  // Status map for the global view.
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

  return {
    authedUsername: personalUsername,
    globalKpis,
    personalKpis,
    totals,
    statusByCountryGlobal,
    statusByCountryPersonal,
    topTravelers,
  };
}
