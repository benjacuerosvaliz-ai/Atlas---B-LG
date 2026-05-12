"use client";

import distance from "@turf/distance";
import { point } from "@turf/helpers";
import {
  Bike,
  Car,
  Footprints,
  Mountain,
  PersonStanding,
  Plane,
  Snowflake,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ACTIVITY_LABELS, type ActivityType, type TripFormData } from "../types";

type Props = {
  data: TripFormData;
  patch: (partial: Partial<TripFormData>) => void;
};

const ACTIVITIES: { id: ActivityType; icon: LucideIcon }[] = [
  { id: "hike", icon: Mountain },
  { id: "run", icon: Footprints },
  { id: "bike", icon: Bike },
  { id: "walk", icon: PersonStanding },
  { id: "drive", icon: Car },
  { id: "fly", icon: Plane },
  { id: "climb", icon: TrendingUp },
  { id: "ski", icon: Snowflake },
];

export function StepActivity({ data, patch }: Props) {
  const suggestedKm = useMemo(() => {
    if (!data.startPlace || !data.endPlace) return null;
    const from = point([data.startPlace.longitude, data.startPlace.latitude]);
    const to = point([data.endPlace.longitude, data.endPlace.latitude]);
    return Math.round(distance(from, to, { units: "kilometers" }) * 10) / 10;
  }, [data.startPlace, data.endPlace]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
          ¿Cómo te moviste?
        </span>
        <h2 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
          Actividad y distancia.
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          Actividad <span className="text-destructive">*</span>
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACTIVITIES.map(({ id, icon: Icon }) => {
            const selected = data.activityType === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => patch({ activityType: id })}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 border px-3 py-5 transition-colors",
                  selected
                    ? "border-foreground bg-foreground/[0.06]"
                    : "border-border hover:border-foreground/60",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    selected ? "text-foreground" : "text-foreground/60",
                  )}
                  aria-hidden
                />
                <span className="text-[10px] uppercase tracking-[0.24em]">
                  {ACTIVITY_LABELS[id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-8">
        <label className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          Distancia <span className="text-destructive">*</span>
        </label>
        <div className="flex items-baseline gap-3">
          <input
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            value={data.distanceKm ?? ""}
            onChange={(e) =>
              patch({
                distanceKm:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            placeholder="0"
            className="w-32 border-b border-border bg-transparent py-3 font-mono text-2xl tracking-tight placeholder:text-foreground/20 focus:border-foreground focus:outline-none transition-colors"
          />
          <span className="font-mono text-sm text-foreground/40">km</span>
        </div>
        {suggestedKm !== null && (
          <div className="flex items-center gap-3 pt-1">
            <span className="font-mono text-xs text-foreground/45">
              Distancia great-circle entre los dos puntos: {suggestedKm} km
            </span>
            <button
              type="button"
              onClick={() => patch({ distanceKm: suggestedKm })}
              className="text-[10px] uppercase tracking-[0.24em] text-foreground/70 underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Usar
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          Desnivel positivo (opcional)
        </label>
        <div className="flex items-baseline gap-3">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={data.elevationGainM ?? ""}
            onChange={(e) =>
              patch({
                elevationGainM:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            placeholder="0"
            className="w-32 border-b border-border bg-transparent py-3 font-mono text-lg tracking-tight placeholder:text-foreground/20 focus:border-foreground focus:outline-none transition-colors"
          />
          <span className="font-mono text-sm text-foreground/40">m</span>
        </div>
      </div>
    </div>
  );
}
