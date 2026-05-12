"use client";

import { Radio, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { Globe, type GlobePoint } from "@/components/globe/Globe";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_LABELS, type ActivityType } from "@/app/trip/new/types";
import { tripDisplayTitle } from "@/components/trip-card";

export type AtlasTrip = {
  id: string;
  title: string | null;
  startShortName: string | null;
  endShortName: string | null;
  startPlaceName: string | null;
  endPlaceName: string | null;
  distanceKm: number | null;
  coverPhotoUrl: string | null;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
  countryCodes: string[];
  activityType: string | null;
  userId: string;
  username: string | null;
  displayName: string | null;
  modelIds: string[];
};

export type CatalogEntry = {
  id: string;
  name: string;
  category: string | null;
};

const ACTIVITIES: { id: ActivityType; label: string }[] = (
  Object.entries(ACTIVITY_LABELS) as [ActivityType, string][]
).map(([id, label]) => ({ id, label }));

type Props = {
  initialTrips: AtlasTrip[];
  catalog: CatalogEntry[];
};

export function AtlasClient({ initialTrips, catalog }: Props) {
  const [trips, setTrips] = useState<AtlasTrip[]>(initialTrips);
  const [modelFilter, setModelFilter] = useState<string>("");
  const [activityFilter, setActivityFilter] = useState<string>("");
  const [pulseAt, setPulseAt] = useState<number>(0);
  const seenIds = useRef(new Set(initialTrips.map((t) => t.id)));

  // Realtime subscription: every new public trip insert lands here.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("atlas-trips")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trips",
          filter: "visibility=eq.public",
        },
        async (payload) => {
          const newId = (payload.new as { id?: string }).id;
          if (!newId || seenIds.current.has(newId)) return;
          seenIds.current.add(newId);

          // Re-fetch with the joins so the new row has author + model tags.
          const { data } = await supabase
            .from("trips")
            .select(
              `id, title, start_short_name, end_short_name, start_place_name, end_place_name,
               distance_km, cover_photo_url, start_lat, start_lng, end_lat, end_lng,
               country_codes, activity_type, user_id, start_at,
               trip_claimed_models(model_id),
               users(username, display_name)`,
            )
            .eq("id", newId)
            .single();

          if (!data) return;
          const u = data.users as unknown as {
            username: string;
            display_name: string | null;
          } | null;
          const claims = data.trip_claimed_models as unknown as
            | { model_id: string }[]
            | null;
          const next: AtlasTrip = {
            id: data.id as string,
            title: (data.title as string | null) ?? null,
            startShortName: (data.start_short_name as string | null) ?? null,
            endShortName: (data.end_short_name as string | null) ?? null,
            startPlaceName: (data.start_place_name as string | null) ?? null,
            endPlaceName: (data.end_place_name as string | null) ?? null,
            distanceKm: (data.distance_km as number | null) ?? null,
            coverPhotoUrl: (data.cover_photo_url as string | null) ?? null,
            startLat: (data.start_lat as number | null) ?? null,
            startLng: (data.start_lng as number | null) ?? null,
            endLat: (data.end_lat as number | null) ?? null,
            endLng: (data.end_lng as number | null) ?? null,
            countryCodes: (data.country_codes as string[] | null) ?? [],
            activityType: (data.activity_type as string | null) ?? null,
            userId: data.user_id as string,
            username: u?.username ?? null,
            displayName: u?.display_name ?? null,
            modelIds: (claims ?? []).map((c) => c.model_id),
          };
          setTrips((curr) => [next, ...curr]);
          setPulseAt(Date.now());
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-clear the "Nuevo trip" pulse after a few seconds.
  useEffect(() => {
    if (!pulseAt) return;
    const timer = setTimeout(() => setPulseAt(0), 4000);
    return () => clearTimeout(timer);
  }, [pulseAt]);

  // Apply filters.
  const filtered = useMemo(() => {
    return trips.filter((t) => {
      if (modelFilter && !t.modelIds.includes(modelFilter)) return false;
      if (activityFilter && t.activityType !== activityFilter) return false;
      return true;
    });
  }, [trips, modelFilter, activityFilter]);

  // Globe points: group by short_name; same trip can contribute at two
  // endpoints, dedupe via tripId.
  const points = useMemo(() => {
    type LocBucket = {
      lat: number;
      lng: number;
      name: string;
      tripIds: Set<string>;
      trips: NonNullable<GlobePoint["trips"]>;
    };
    const byPlace = new Map<string, LocBucket>();
    function visit(
      name: string | null,
      lat: number | null,
      lng: number | null,
      trip: NonNullable<GlobePoint["trips"]>[number],
    ) {
      if (!name || typeof lat !== "number" || typeof lng !== "number") return;
      if (!byPlace.has(name)) {
        byPlace.set(name, { lat, lng, name, tripIds: new Set(), trips: [] });
      }
      const b = byPlace.get(name)!;
      if (!b.tripIds.has(trip.id)) {
        b.tripIds.add(trip.id);
        b.trips.push(trip);
      }
    }
    for (const t of filtered) {
      const meta = {
        id: t.id,
        title: tripDisplayTitle({
          title: t.title,
          start_short_name: t.startShortName,
          end_short_name: t.endShortName,
          start_place_name: t.startPlaceName,
          end_place_name: t.endPlaceName,
        }),
        distanceKm: t.distanceKm,
        coverPhotoUrl: t.coverPhotoUrl,
      };
      visit(t.startShortName, t.startLat, t.startLng, meta);
      visit(t.endShortName, t.endLat, t.endLng, meta);
    }
    const out: GlobePoint[] = [];
    for (const b of byPlace.values()) {
      out.push({ lat: b.lat, lng: b.lng, name: b.name, trips: b.trips });
    }
    return out;
  }, [filtered]);

  // Live KPIs (filtered).
  const totalKm = useMemo(
    () => Math.round(filtered.reduce((acc, t) => acc + (t.distanceKm ?? 0), 0)),
    [filtered],
  );
  const countries = useMemo(() => {
    const s = new Set<string>();
    for (const t of filtered) for (const c of t.countryCodes) if (c) s.add(c);
    return s.size;
  }, [filtered]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* Header bar */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4 md:px-10 md:py-5">
        <BolgWordmark href="/" />
        <div className="flex items-center gap-3">
          {pulseAt > 0 && (
            <span className="flex items-center gap-1.5 border border-aurora/60 bg-aurora/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-aurora">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-aurora/60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-aurora" />
              </span>
              Nuevo trip
            </span>
          )}
          <Link
            href="/dashboard"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      {/* Globe full screen */}
      <Globe points={points} height="100dvh" cameraDistance={4.2} />

      {/* HUD: stats + filters, glassmorphic, top-left, mobile-friendly */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 z-20 flex flex-col gap-3 px-4 pb-6 md:left-6 md:right-auto md:bottom-6 md:max-w-xs md:px-0 md:pb-0">
        <div className="pointer-events-auto flex flex-col gap-4 border border-border bg-card/85 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-aurora" aria-hidden />
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/60">
              En vivo
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat value={filtered.length} label="Viajes" />
            <Stat value={totalKm} label="Km" />
            <Stat value={countries} label="Países" />
          </div>
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            <FilterRow label="Modelo">
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className={selectCls}
              >
                <option value="">Todos los BØLG</option>
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FilterRow>
            <FilterRow label="Actividad">
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className={selectCls}
              >
                <option value="">Todas</option>
                {ACTIVITIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </FilterRow>
            {(modelFilter || activityFilter) && (
              <button
                type="button"
                onClick={() => {
                  setModelFilter("");
                  setActivityFilter("");
                }}
                className="flex items-center gap-1.5 self-start text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-xl font-bold tabular-nums leading-none tracking-tight">
        {value.toLocaleString("es-CL")}
      </span>
      <span className="text-[9px] uppercase tracking-[0.28em] text-foreground/50">
        {label}
      </span>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-[0.28em] text-foreground/45">
        {label}
      </span>
      {children}
    </div>
  );
}

const selectCls =
  "w-full appearance-none border-b border-border bg-transparent py-1.5 pr-2 text-sm focus:border-foreground focus:outline-none transition-colors cursor-pointer";
