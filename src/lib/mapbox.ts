/**
 * Mapbox Geocoding v6 client. Forward geocoding for place autocomplete on
 * the trip wizard. Browser-callable (token is public/restricted by URL).
 *
 * Docs: https://docs.mapbox.com/api/search/geocoding-v6/
 */

const ENDPOINT = "https://api.mapbox.com/search/geocode/v6/forward";

export type Place = {
  /** Mapbox feature id (stable across queries). */
  id: string;
  /** Display name, e.g. "Santiago, Chile". */
  name: string;
  /** Fuller human address. */
  placeFormatted: string;
  /** ISO 3166-1 alpha-2, lowercased to match our schema convention. */
  countryCode: string | null;
  /** Country display name. */
  country: string | null;
  longitude: number;
  latitude: number;
};

type MapboxFeature = {
  id: string;
  properties: {
    name?: string;
    place_formatted?: string;
    coordinates?: { longitude: number; latitude: number };
    context?: {
      country?: { country_code?: string; name?: string };
    };
  };
};

type MapboxResponse = {
  features?: MapboxFeature[];
};

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.warn("[mapbox] missing NEXT_PUBLIC_MAPBOX_TOKEN");
    return [];
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "6");
  url.searchParams.set("language", "es");
  // Bias autocomplete to Andean Spanish-speaking countries so "Maitencillo"
  // doesn't resolve to a homonym 600 km away on another continent.
  url.searchParams.set("country", "cl,ar,pe,bo,ec,co,uy,br,mx,es");
  // Center proximity around Santiago — most BØLG customers are Chilean.
  // Mapbox prioritizes closer results when proximity is set.
  url.searchParams.set("proximity", "-70.65,-33.45");

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Mapbox geocoding failed: ${res.status}`);
  }
  const json = (await res.json()) as MapboxResponse;

  return (json.features ?? []).map((f): Place => {
    const country = f.properties.context?.country;
    return {
      id: f.id,
      name: f.properties.name ?? "",
      placeFormatted: f.properties.place_formatted ?? f.properties.name ?? "",
      countryCode: country?.country_code?.toLowerCase() ?? null,
      country: country?.name ?? null,
      longitude: f.properties.coordinates?.longitude ?? 0,
      latitude: f.properties.coordinates?.latitude ?? 0,
    };
  });
}
