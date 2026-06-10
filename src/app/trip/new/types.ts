import type { City } from "@/lib/mapbox";
import type { UploadedAsset } from "@/lib/cloudinary-upload";

/**
 * Forma del form "Cargar viaje" del v2 (slide 5 del PPT).
 *
 * Cambios respecto del wizard viejo:
 * - El usuario elige origen + destino como CIUDADES estructuradas (Mapbox
 *   type=place), no como places free-form.
 * - La fecha es solo mes + año (sin día ni rango).
 * - No se pregunta distancia ni tipo de actividad — la distancia se
 *   calcula automático por haversine entre las dos ciudades.
 */
export type TripFormData = {
  /** "De dónde venías". */
  originCity?: City;
  /** Ciudad a la que llegaste. */
  destinationCity?: City;
  /** 1-12. */
  month?: number;
  /** YYYY. */
  year?: number;
  /** Foto única opcional. */
  photo?: UploadedAsset;
  /** Productos BØLG reclamados para este viaje. Cualquier reclamo marca
   *  bolg_visible=true en las city_visits y habilita la regla de
   *  destronación de conquista. */
  claimedModelIds: string[];
};

export type ProductModelLite = {
  id: string;
  name: string;
  category: string | null;
  heroImageUrl: string | null;
  productUrl: string | null;
  /** Ya está en el equipaje del usuario. UI muestra una pista. */
  alreadyOwned: boolean;
};

export const EMPTY_FORM: TripFormData = {
  claimedModelIds: [],
};

/**
 * Activity types — el form v2 ya no los pregunta (default = "drive"), pero
 * los viajes viejos (pre-v2) tienen valores variados que la trip detail
 * page sigue mostrando. Mantenemos los labels acá para que ese display no
 * rompa.
 */
export type ActivityType =
  | "hike"
  | "run"
  | "bike"
  | "drive"
  | "fly"
  | "walk"
  | "climb"
  | "ski";

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  hike: "Caminata",
  run: "Running",
  bike: "Bici",
  drive: "Auto",
  fly: "Vuelo",
  walk: "Caminar",
  climb: "Escalada",
  ski: "Ski",
};

export const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;
