"use client";

import { ArrowRight, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { Globe, type GlobePoint, type GlobeArc } from "@/components/globe/Globe";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { tripDisplayTitle } from "@/components/trip-card";
import { cn } from "@/lib/utils";

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
  avatarUrl: string | null;
  startAt: string | null;
};

export type TopTraveler = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalKm: number;
};

type Props = {
  initialTrips: AtlasTrip[];
  topTravelers: TopTraveler[];
  authedUsername: string | null;
};

// Display name resolver for ISO 3166-1 alpha-2 codes. Falls back to the
// raw code if Intl.DisplayNames isn't available (very old browsers).
function countryDisplayName(code: string): string {
  if (!code) return "";
  try {
    const dn = new Intl.DisplayNames(["es"], { type: "region" });
    return dn.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

// Emoji flag from a 2-letter country code. Pure unicode trick; renders as
// the flag on any platform that supports regional indicator pairs (most do).
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function AtlasClient({ initialTrips, topTravelers, authedUsername }: Props) {
  const [trips, setTrips] = useState<AtlasTrip[]>(initialTrips);
  const [pulseAt, setPulseAt] = useState<number>(0);
  const [arcs, setArcs] = useState<GlobeArc[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const seenIds = useRef(new Set(initialTrips.map((t) => t.id)));

  // Realtime subscription: every new public trip insert lands here and (a)
  // appears as a photo marker, (b) flashes a "Nuevo trip" pulse, and (c)
  // animates an arc from origin → destination over the globe for ~6s.
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

          const { data } = await supabase
            .from("trips")
            .select(
              `id, title, start_short_name, end_short_name, start_place_name, end_place_name,
               distance_km, cover_photo_url, start_lat, start_lng, end_lat, end_lng,
               country_codes, activity_type, user_id, start_at,
               users(username, display_name, avatar_url)`,
            )
            .eq("id", newId)
            .single();

          if (!data) return;
          const u = data.users as unknown as {
            username: string;
            display_name: string | null;
            avatar_url: string | null;
          } | null;
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
            avatarUrl: u?.avatar_url ?? null,
            startAt: (data.start_at as string | null) ?? null,
          };
          setTrips((curr) => [next, ...curr]);
          setPulseAt(Date.now());

          // Queue the trip as an animated arc if we have both endpoints.
          if (
            typeof next.startLat === "number" &&
            typeof next.startLng === "number" &&
            typeof next.endLat === "number" &&
            typeof next.endLng === "number"
          ) {
            const arcId = `arc-${next.id}-${Date.now()}`;
            setArcs((curr) => [
              ...curr,
              {
                id: arcId,
                startLat: next.startLat as number,
                startLng: next.startLng as number,
                endLat: next.endLat as number,
                endLng: next.endLng as number,
                createdAt: Date.now(),
              },
            ]);
            // Garbage-collect after the arc's full animation finishes.
            setTimeout(() => {
              setArcs((curr) => curr.filter((a) => a.id !== arcId));
            }, 6500);
          }
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

  // The globe always shows the full community — selecting a country only
  // changes the side panel, not the markers. Keeps the "world map of BØLG"
  // intact while letting users drill into a country's people.

  // Globe markers — same place-name dedupe as before.
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
    for (const t of trips) {
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
        username: t.username,
        displayName: t.displayName,
        avatarUrl: t.avatarUrl,
      };
      visit(t.startShortName, t.startLat, t.startLng, meta);
      visit(t.endShortName, t.endLat, t.endLng, meta);
    }
    const out: GlobePoint[] = [];
    for (const b of byPlace.values()) {
      out.push({ lat: b.lat, lng: b.lng, name: b.name, trips: b.trips });
    }
    return out;
  }, [trips]);

  // Live KPIs (always for the FULL set, not filtered — the narrative
  // metric is "the whole community", not "just Chile").
  const totalKm = useMemo(
    () => Math.round(trips.reduce((acc, t) => acc + (t.distanceKm ?? 0), 0)),
    [trips],
  );
  const totalCountries = useMemo(() => {
    const s = new Set<string>();
    for (const t of trips) for (const c of t.countryCodes) if (c) s.add(c);
    return s.size;
  }, [trips]);

  // Aggregate (countryCode → trip count) for the chip strip in the HUD.
  // Sorted by trip count desc, then alphabetically for stability.
  const countryChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of trips) {
      for (const c of t.countryCodes) {
        if (!c) continue;
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([code, n]) => ({
        code,
        name: countryDisplayName(code),
        flag: countryFlag(code),
        count: n,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [trips]);

  // For the country panel: hybrid ranking of travelers within the selected
  // country. Score = kilometres in that country + number of trips × 50.
  // The trip multiplier keeps frequent visitors competitive against
  // single-shot long-haul outliers.
  const travelersInCountry = useMemo(() => {
    if (!selectedCountry) return [];
    const byUser = new Map<
      string,
      {
        userId: string;
        username: string | null;
        displayName: string | null;
        avatarUrl: string | null;
        trips: number;
        km: number;
      }
    >();
    for (const t of trips) {
      if (!t.countryCodes.includes(selectedCountry)) continue;
      const k = t.userId;
      if (!byUser.has(k)) {
        byUser.set(k, {
          userId: t.userId,
          username: t.username,
          displayName: t.displayName,
          avatarUrl: t.avatarUrl,
          trips: 0,
          km: 0,
        });
      }
      const row = byUser.get(k)!;
      row.trips += 1;
      row.km += t.distanceKm ?? 0;
    }
    return Array.from(byUser.values())
      .map((r) => ({ ...r, score: r.km + r.trips * 50 }))
      .sort((a, b) => b.score - a.score);
  }, [trips, selectedCountry]);

  const selectedCountryName = selectedCountry
    ? countryDisplayName(selectedCountry)
    : null;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* Header overlay */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-4 md:px-8 md:py-5">
        <BolgWordmark href="/" />

        <div className="flex items-center gap-3 md:gap-5">
          {topTravelers.length > 0 && <TopTravelersChip travelers={topTravelers} />}

          <Link
            href="/sobre"
            className="hidden text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors sm:inline"
          >
            ¿Primera vez? →
          </Link>

          {authedUsername ? (
            <Link
              href="/dashboard"
              className="text-[10px] uppercase tracking-[0.28em] text-foreground hover:text-foreground/70 transition-colors"
            >
              Mi panel →
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[10px] uppercase tracking-[0.28em] text-foreground hover:text-foreground/70 transition-colors"
            >
              Ingresar
            </Link>
          )}
        </div>
      </header>

      {/* Globe full screen */}
      <Globe
        points={points}
        arcs={arcs}
        height="100dvh"
        cameraDistance={4.2}
        panelPlacement="top"
      />

      {/* Bottom HUD — small live counter + scrollable country chips */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 px-4 pb-5 md:px-8 md:pb-6">
        <div className="pointer-events-auto flex flex-col gap-3 border border-border bg-card/85 p-3 backdrop-blur-sm md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-foreground/65">
              La comunidad BØLG
              {/* Transient "+ Nuevo viaje" badge — sólo aparece al recibir
                  un INSERT por realtime y se va solo en 4s. Cuando no hay
                  nada nuevo, el label queda limpio (histórico). */}
              {pulseAt > 0 && (
                <span className="flex items-center gap-1 text-aurora">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-aurora/60" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-aurora" />
                  </span>
                  Nuevo viaje
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums text-foreground/85 md:text-xs">
              <Counter value={trips.length} label="viajes" />
              <Counter value={totalKm} label="km" />
              <Counter value={totalCountries} label="países" />
            </div>
          </div>

          {countryChips.length > 0 && (
            <div className="-mx-3 overflow-x-auto px-3 md:-mx-4 md:px-4">
              <div className="flex min-w-min items-center gap-2">
                {selectedCountry && (
                  <button
                    type="button"
                    onClick={() => setSelectedCountry(null)}
                    className="flex shrink-0 items-center gap-1 border border-border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.24em] text-foreground/55 hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Ver todo
                  </button>
                )}
                {countryChips.map((c) => {
                  const active = c.code === selectedCountry;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() =>
                        setSelectedCountry((curr) => (curr === c.code ? null : c.code))
                      }
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.24em] transition-colors",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground/65 hover:border-foreground/70 hover:text-foreground",
                      )}
                    >
                      <span className="text-sm leading-none">{c.flag}</span>
                      <span>{c.name}</span>
                      <span
                        className={cn(
                          "font-mono tabular-nums",
                          active ? "text-background/70" : "text-foreground/40",
                        )}
                      >
                        · {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subtle community invitation. Only shown to anonymous visitors —
              authed users are already part of the community. Anchored at
              the bottom of the HUD so it feels like part of the data, not
              a banner. */}
          {!authedUsername && (
            <Link
              href="/login"
              className="group -mx-3 -mb-3 flex items-center justify-center gap-2 border-t border-border bg-foreground/[0.03] px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.32em] text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground transition-colors md:-mx-4 md:-mb-4 md:px-4"
            >
              Hazte parte de la comunidad
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Country panel — slides in from the right on desktop, bottom drawer
          on mobile. Lists BØLG travelers ranked by hybrid score (km + trips). */}
      {selectedCountry && (
        <CountryPanel
          name={selectedCountryName ?? ""}
          flag={countryFlag(selectedCountry)}
          travelers={travelersInCountry}
          showInvite={!authedUsername}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </div>
  );
}

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="font-display text-base font-black leading-none tracking-tight md:text-lg">
        {value.toLocaleString("es-CL")}
      </span>
      <span className="text-[9px] uppercase tracking-[0.24em] text-foreground/50">
        {label}
      </span>
    </span>
  );
}

function TopTravelersChip({ travelers }: { travelers: TopTraveler[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label="Ver top viajeros"
        className="flex items-center gap-1.5 border border-border bg-card/85 px-2 py-1.5 backdrop-blur-sm hover:border-foreground/70 transition-colors"
      >
        <span className="text-[9px] uppercase tracking-[0.28em] text-foreground/55">
          Top
        </span>
        <div className="flex -space-x-2">
          {travelers.slice(0, 3).map((t) => {
            const initials = initialsFrom(t.displayName ?? t.username);
            return (
              <Avatar
                key={t.id}
                className="h-6 w-6 border border-card bg-fog"
              >
                {t.avatarUrl && (
                  <AvatarImage src={t.avatarUrl} alt={t.displayName ?? t.username} />
                )}
                <AvatarFallback className="bg-fog text-[9px] font-black text-foreground/75">
                  {initials}
                </AvatarFallback>
              </Avatar>
            );
          })}
        </div>
      </button>

      {expanded && (
        <ul className="absolute right-0 top-full z-40 mt-2 flex w-64 flex-col border border-border bg-card/95 backdrop-blur-sm">
          {travelers.map((t, idx) => {
            const initials = initialsFrom(t.displayName ?? t.username);
            return (
              <li key={t.id}>
                <Link
                  href={`/u/${t.username}`}
                  className="group flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-b-0 hover:bg-foreground/[0.04] transition-colors"
                >
                  <span className="w-5 shrink-0 font-mono text-[10px] tabular-nums text-foreground/45">
                    #{idx + 1}
                  </span>
                  <Avatar className="h-9 w-9 shrink-0 bg-fog">
                    {t.avatarUrl && (
                      <AvatarImage src={t.avatarUrl} alt={t.displayName ?? t.username} />
                    )}
                    <AvatarFallback className="bg-fog text-[10px] font-black text-foreground/75">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm">
                      {t.displayName ?? `@${t.username}`}
                    </span>
                    <span className="truncate font-mono text-[10px] tabular-nums text-foreground/55">
                      {Math.round(t.totalKm).toLocaleString("es-CL")} km
                    </span>
                  </div>
                  <ChevronRight className="h-3 w-3 shrink-0 text-foreground/35 group-hover:text-foreground transition-colors" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CountryPanel({
  name,
  flag,
  travelers,
  showInvite,
  onClose,
}: {
  name: string;
  flag: string;
  travelers: Array<{
    userId: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    trips: number;
    km: number;
  }>;
  showInvite: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "absolute z-40 flex flex-col gap-3 border border-border bg-card/95 backdrop-blur-md",
        // Desktop: side panel anchored to the right, well clear of the HUD.
        "md:right-6 md:top-[80px] md:bottom-[160px] md:w-[360px] md:max-w-[40vw]",
        // Mobile: bottom drawer above the HUD.
        "inset-x-3 bottom-[170px] top-[80px] md:inset-auto",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/55">
            {travelers.length === 1
              ? "1 persona ha estado en"
              : `${travelers.length} personas han estado en`}
          </span>
          <h2 className="flex items-center gap-2 font-display text-2xl font-black leading-tight tracking-tight">
            <span className="text-3xl leading-none">{flag}</span>
            {name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-foreground/50 hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {travelers.length === 0 ? (
        <p className="px-4 py-6 font-mono text-xs text-foreground/55">
          Aún nadie ha registrado un viaje acá. Sé el primero.
        </p>
      ) : (
        <ul className="flex-1 overflow-y-auto pb-1">
          {travelers.map((t, idx) => {
            const initials = initialsFrom(t.displayName ?? t.username ?? "");
            return (
              <li key={t.userId}>
                <Link
                  href={t.username ? `/u/${t.username}` : "#"}
                  className="group flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-foreground/[0.04] transition-colors"
                >
                  <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums text-foreground/45">
                    #{idx + 1}
                  </span>
                  <Avatar className="h-11 w-11 shrink-0 bg-fog">
                    {t.avatarUrl && (
                      <AvatarImage
                        src={t.avatarUrl}
                        alt={t.displayName ?? t.username ?? ""}
                      />
                    )}
                    <AvatarFallback className="bg-fog text-xs font-black text-foreground/75">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm">
                      {t.displayName ?? (t.username ? `@${t.username}` : "Anónimo")}
                    </span>
                    {t.username && (
                      <span className="truncate font-mono text-[10px] text-foreground/45">
                        @{t.username}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-foreground/35 group-hover:text-foreground transition-colors" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {showInvite && (
        <Link
          href="/login"
          className="group flex items-center justify-center gap-2 border-t border-border bg-foreground/[0.03] px-4 py-3 text-center text-[10px] uppercase tracking-[0.32em] text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground transition-colors"
        >
          Hazte parte de la comunidad
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function initialsFrom(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "·"
  );
}
