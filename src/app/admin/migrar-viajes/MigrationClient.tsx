"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { CityPicker } from "@/components/city-picker";
import type { City } from "@/lib/mapbox";
import { cn } from "@/lib/utils";
import { migrateTrip, skipTrip } from "./actions";

export type LegacyTrip = {
  id: string;
  title: string | null;
  startShortName: string | null;
  endShortName: string | null;
  startPlaceName: string | null;
  endPlaceName: string | null;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
  distanceKm: number | null;
  startAt: string | null;
  userId: string;
  countsForBolg: boolean;
  username: string | null;
  displayName: string | null;
};

type Props = { trips: LegacyTrip[] };

export function MigrationClient({ trips }: Props) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  if (trips.length === 0) {
    return (
      <p className="border border-border bg-card/40 px-6 py-10 text-center font-mono text-sm text-foreground/55">
        ✓ Sin viajes pendientes. Todos los trips están migrados.
      </p>
    );
  }

  const pending = trips.filter((t) => !resolved.has(t.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between border-b border-border pb-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/55">
          Pendientes
        </span>
        <span className="font-mono text-sm tabular-nums">
          {pending.length} / {trips.length}
        </span>
      </div>
      <ul className="flex flex-col gap-4">
        {pending.map((t) => (
          <TripRow
            key={t.id}
            trip={t}
            onDone={() => setResolved((prev) => new Set(prev).add(t.id))}
          />
        ))}
      </ul>
    </div>
  );
}

function TripRow({
  trip,
  onDone,
}: {
  trip: LegacyTrip;
  onDone: () => void;
}) {
  const [origin, setOrigin] = useState<City | undefined>();
  const [destination, setDestination] = useState<City | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!origin || !destination) {
      setError("Selecciona ambas ciudades antes de migrar.");
      return;
    }
    startTransition(async () => {
      const res = await migrateTrip({
        tripId: trip.id,
        originCity: origin,
        destinationCity: destination,
      });
      if (res?.error) setError(res.error);
      else onDone();
    });
  }

  function skip() {
    setError(null);
    startTransition(async () => {
      const res = await skipTrip(trip.id);
      if (res?.error) setError(res.error);
      else onDone();
    });
  }

  const author = trip.displayName ?? trip.username ?? "anónimo";
  const dateLabel = trip.startAt
    ? new Date(trip.startAt).toLocaleDateString("es-CL", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <li
      className={cn(
        "flex flex-col gap-5 border border-border p-4 transition-colors md:p-5",
        isPending && "opacity-60",
      )}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">
            {trip.startShortName ?? "?"} → {trip.endShortName ?? "?"}
          </span>
          <span className="font-mono text-[10px] text-foreground/45">
            @{trip.username ?? "?"} · {author} · {dateLabel} ·{" "}
            {(trip.distanceKm ?? 0).toLocaleString("es-CL")} km
            {trip.countsForBolg && " · BØLG"}
          </span>
        </div>
        <span className="font-mono text-[10px] text-foreground/40">
          {trip.id.slice(0, 8)}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CityPicker
          label="Origen real"
          value={origin}
          onChange={setOrigin}
          placeholder={trip.startPlaceName ?? "Buscar..."}
          suggestion={trip.startShortName}
          required
        />
        <CityPicker
          label="Destino real"
          value={destination}
          onChange={setDestination}
          placeholder={trip.endPlaceName ?? "Buscar..."}
          suggestion={trip.endShortName}
          required
        />
      </div>

      {error && (
        <p className="font-mono text-xs text-destructive">{error}</p>
      )}

      <footer className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={skip}
          disabled={isPending}
          className="flex items-center gap-1.5 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/65 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="h-3 w-3" /> Skip
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !origin || !destination}
          className="flex items-center gap-2 bg-foreground px-4 py-2.5 text-[10px] uppercase tracking-[0.28em] text-background transition-colors hover:bg-foreground/80 disabled:opacity-30"
        >
          {isPending ? (
            <>
              Procesando
              <Loader2 className="h-3 w-3 animate-spin" />
            </>
          ) : (
            <>
              Migrar
              <Check className="h-3 w-3" />
            </>
          )}
        </button>
      </footer>
    </li>
  );
}
