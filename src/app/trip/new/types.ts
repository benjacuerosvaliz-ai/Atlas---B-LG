import type { Place } from "@/lib/mapbox";
import type { UploadedAsset } from "@/lib/cloudinary-upload";

export type ActivityType =
  | "hike"
  | "run"
  | "bike"
  | "drive"
  | "fly"
  | "walk"
  | "climb"
  | "ski";

export type TripFormData = {
  title?: string;
  description?: string;
  startPlace?: Place;
  endPlace?: Place;
  startAt?: string;  // ISO date "YYYY-MM-DD"
  endAt?: string;
  activityType?: ActivityType;
  distanceKm?: number;
  elevationGainM?: number;
  photos: UploadedAsset[];
  /** Self-claimed model IDs ("Viajé con este Oslo"). Each requires the trip
   *  to have at least one photo as evidence. */
  claimedModelIds: string[];
};

export type ProductModelLite = {
  id: string;
  name: string;
  category: string | null;
  heroImageUrl: string | null;
  productUrl: string | null;
  /** True when the user already has this model in their collection (from a
   *  previous trip's claim). Lets the UI surface "already in your gear". */
  alreadyOwned: boolean;
};

export const EMPTY_FORM: TripFormData = {
  photos: [],
  claimedModelIds: [],
};

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
