"use client";

import { PlaceAutocomplete } from "@/components/place-autocomplete";
import type { TripFormData } from "../types";

type Props = {
  data: TripFormData;
  patch: (partial: Partial<TripFormData>) => void;
  userCity: string | null;
};

export function StepPlace({ data, patch, userCity }: Props) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
          ¿Dónde estuviste?
        </span>
        <h2 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
          Empieza por el lugar.
        </h2>
        <p className="max-w-md text-base leading-relaxed text-foreground/60">
          Mínimo el punto de inicio. Si tu viaje cruzó países o ciudades, suma
          el destino — calculamos los kilómetros automáticamente.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <PlaceAutocomplete
          label="Inicio"
          value={data.startPlace}
          onChange={(place) => patch({ startPlace: place })}
          placeholder="Pucón, Chile"
          required
          suggestion={userCity}
        />
        <PlaceAutocomplete
          label="Destino (opcional)"
          value={data.endPlace}
          onChange={(place) => patch({ endPlace: place })}
          placeholder="San Pedro de Atacama, Chile"
        />
      </div>
    </div>
  );
}
