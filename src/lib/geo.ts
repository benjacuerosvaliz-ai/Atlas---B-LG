/**
 * Geo helpers para el modelo de conquista del Atlas v2.
 *
 * - Mapa estático ISO 3166-1 alpha-2 → continente (códigos: AF, AN, AS,
 *   EU, NA, OC, SA).
 * - Lista de países por continente, para el umbral >50% que define un
 *   continente "conquistado completo" en el mapa global.
 * - Las 7 maravillas modernas con lat/lng + radio para matchear por
 *   proximidad cuando un usuario visita una ciudad cercana.
 *
 * Nada de esto vive en la DB todavía — es referencia client/server.
 */

export type ContinentCode = "AF" | "AN" | "AS" | "EU" | "NA" | "OC" | "SA";

export const CONTINENT_NAMES: Record<ContinentCode, string> = {
  AF: "África",
  AN: "Antártida",
  AS: "Asia",
  EU: "Europa",
  NA: "Norteamérica",
  OC: "Oceanía",
  SA: "Sudamérica",
};

/**
 * Country ISO 3166-1 alpha-2 (LOWERCASE) → continent code.
 * Fuente: https://datahub.io/core/country-codes — lista canónica.
 * Mantenido lowercase porque el resto de la app usa countryCode lowercase
 * (Mapbox v6 + nuestro schema).
 */
// prettier-ignore
export const COUNTRY_TO_CONTINENT: Record<string, ContinentCode> = {
  // Africa
  ao: "AF", bf: "AF", bi: "AF", bj: "AF", bw: "AF", cd: "AF", cf: "AF",
  cg: "AF", ci: "AF", cm: "AF", cv: "AF", dj: "AF", dz: "AF", eg: "AF",
  eh: "AF", er: "AF", et: "AF", ga: "AF", gh: "AF", gm: "AF", gn: "AF",
  gq: "AF", gw: "AF", ke: "AF", km: "AF", lr: "AF", ls: "AF", ly: "AF",
  ma: "AF", mg: "AF", ml: "AF", mr: "AF", mu: "AF", mw: "AF", mz: "AF",
  na: "AF", ne: "AF", ng: "AF", re: "AF", rw: "AF", sc: "AF", sd: "AF",
  sh: "AF", sl: "AF", sn: "AF", so: "AF", ss: "AF", st: "AF", sz: "AF",
  td: "AF", tg: "AF", tn: "AF", tz: "AF", ug: "AF", yt: "AF", za: "AF",
  zm: "AF", zw: "AF",

  // Antarctica
  aq: "AN", bv: "AN", gs: "AN", hm: "AN", tf: "AN",

  // Asia
  ae: "AS", af: "AS", am: "AS", az: "AS", bd: "AS", bh: "AS", bn: "AS",
  bt: "AS", cc: "AS", cn: "AS", cx: "AS", cy: "AS", ge: "AS", hk: "AS",
  id: "AS", il: "AS", in: "AS", io: "AS", iq: "AS", ir: "AS", jo: "AS",
  jp: "AS", kg: "AS", kh: "AS", kp: "AS", kr: "AS", kw: "AS", kz: "AS",
  la: "AS", lb: "AS", lk: "AS", mm: "AS", mn: "AS", mo: "AS", mv: "AS",
  my: "AS", np: "AS", om: "AS", ph: "AS", pk: "AS", ps: "AS", qa: "AS",
  sa: "AS", sg: "AS", sy: "AS", th: "AS", tj: "AS", tl: "AS", tm: "AS",
  tr: "AS", tw: "AS", uz: "AS", vn: "AS", ye: "AS",

  // Europe
  ad: "EU", al: "EU", at: "EU", ax: "EU", ba: "EU", be: "EU", bg: "EU",
  by: "EU", ch: "EU", cz: "EU", de: "EU", dk: "EU", ee: "EU", es: "EU",
  fi: "EU", fo: "EU", fr: "EU", gb: "EU", gg: "EU", gi: "EU", gr: "EU",
  hr: "EU", hu: "EU", ie: "EU", im: "EU", is: "EU", it: "EU", je: "EU",
  li: "EU", lt: "EU", lu: "EU", lv: "EU", mc: "EU", md: "EU", me: "EU",
  mk: "EU", mt: "EU", nl: "EU", no: "EU", pl: "EU", pt: "EU", ro: "EU",
  rs: "EU", ru: "EU", se: "EU", si: "EU", sj: "EU", sk: "EU", sm: "EU",
  ua: "EU", va: "EU", xk: "EU",

  // North America
  ag: "NA", ai: "NA", aw: "NA", bb: "NA", bl: "NA", bm: "NA", bs: "NA",
  bz: "NA", ca: "NA", cr: "NA", cu: "NA", cw: "NA", dm: "NA", do: "NA",
  gd: "NA", gl: "NA", gp: "NA", gt: "NA", hn: "NA", ht: "NA", jm: "NA",
  kn: "NA", ky: "NA", lc: "NA", mf: "NA", mq: "NA", ms: "NA", mx: "NA",
  ni: "NA", pa: "NA", pm: "NA", pr: "NA", sv: "NA", sx: "NA", tc: "NA",
  tt: "NA", us: "NA", vc: "NA", vg: "NA", vi: "NA",

  // Oceania
  as: "OC", au: "OC", ck: "OC", fj: "OC", fm: "OC", gu: "OC", ki: "OC",
  mh: "OC", mp: "OC", nc: "OC", nf: "OC", nr: "OC", nu: "OC", nz: "OC",
  pf: "OC", pg: "OC", pn: "OC", pw: "OC", sb: "OC", tk: "OC", to: "OC",
  tv: "OC", um: "OC", vu: "OC", wf: "OC", ws: "OC",

  // South America
  ar: "SA", bo: "SA", br: "SA", cl: "SA", co: "SA", ec: "SA", fk: "SA",
  gf: "SA", gy: "SA", pe: "SA", py: "SA", sr: "SA", uy: "SA", ve: "SA",
};

/**
 * Cuenta de países por continente, derivada del mapa.
 * Útil para el umbral >50% de conquista continental.
 */
export const COUNTRIES_PER_CONTINENT: Record<ContinentCode, number> =
  (() => {
    const out: Record<ContinentCode, number> = {
      AF: 0,
      AN: 0,
      AS: 0,
      EU: 0,
      NA: 0,
      OC: 0,
      SA: 0,
    };
    for (const c of Object.values(COUNTRY_TO_CONTINENT)) {
      out[c] = (out[c] ?? 0) + 1;
    }
    return out;
  })();

export function continentOf(countryCode: string | null | undefined): ContinentCode | null {
  if (!countryCode) return null;
  return COUNTRY_TO_CONTINENT[countryCode.toLowerCase()] ?? null;
}

// ---------------------------------------------------------------------------
// 7 Maravillas Modernas
// ---------------------------------------------------------------------------
// Lista cerrada, lat/lng del punto canónico de cada maravilla. Para
// adjudicar una maravilla a un usuario, basta con que tenga una visita a
// una ciudad ≤50 km del punto.

export type Wonder = {
  id: string;
  name: string;
  country: string; // ISO alpha-2 lower
  city: string; // ciudad nominal de referencia (display)
  latitude: number;
  longitude: number;
};

export const WONDERS: Wonder[] = [
  {
    id: "chichen-itza",
    name: "Chichén Itzá",
    country: "mx",
    city: "Tinum",
    latitude: 20.6843,
    longitude: -88.5678,
  },
  {
    id: "cristo-redentor",
    name: "Cristo Redentor",
    country: "br",
    city: "Río de Janeiro",
    latitude: -22.9519,
    longitude: -43.2105,
  },
  {
    id: "coliseo",
    name: "Coliseo Romano",
    country: "it",
    city: "Roma",
    latitude: 41.8902,
    longitude: 12.4922,
  },
  {
    id: "gran-muralla",
    name: "Gran Muralla China",
    country: "cn",
    city: "Pekín",
    latitude: 40.4319,
    longitude: 116.5704,
  },
  {
    id: "machu-picchu",
    name: "Machu Picchu",
    country: "pe",
    city: "Aguas Calientes",
    latitude: -13.1631,
    longitude: -72.5450,
  },
  {
    id: "petra",
    name: "Petra",
    country: "jo",
    city: "Wadi Musa",
    latitude: 30.3285,
    longitude: 35.4444,
  },
  {
    id: "taj-mahal",
    name: "Taj Mahal",
    country: "in",
    city: "Agra",
    latitude: 27.1751,
    longitude: 78.0421,
  },
];

/**
 * Haversine en km entre dos puntos lat/lng. Útil para matchear una
 * visita de ciudad contra una maravilla (≤50 km).
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // radio de la Tierra
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Devuelve las maravillas a las que el usuario "está cerca" (≤50 km de la
 * ciudad) según una lista de ciudades visitadas.
 */
export function wondersForVisits(
  visits: Array<{ latitude: number; longitude: number }>,
  radiusKm = 50,
): Wonder[] {
  const hit = new Set<string>();
  for (const w of WONDERS) {
    for (const v of visits) {
      if (haversineKm(v.latitude, v.longitude, w.latitude, w.longitude) <= radiusKm) {
        hit.add(w.id);
        break;
      }
    }
  }
  return WONDERS.filter((w) => hit.has(w.id));
}
