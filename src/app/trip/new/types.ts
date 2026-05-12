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
  productIds: string[];
};

export type OwnedProduct = {
  id: string;
  givenName: string | null;
  modelName: string;
};

export const EMPTY_FORM: TripFormData = {
  photos: [],
  productIds: [],
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
