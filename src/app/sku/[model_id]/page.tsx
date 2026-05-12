import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, type GlobePoint } from "@/components/globe/Globe";
import { TripCard, tripDisplayTitle } from "@/components/trip-card";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ model_id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { model_id } = await params;
  const supabase = await createClient();
  const { data: model } = await supabase
    .from("product_models")
    .select("name, category")
    .eq("id", model_id)
    .single();
  if (!model) return { title: "Producto no encontrado" };
  return {
    title: model.name,
    description: `Aventuras de la comunidad BØLG con ${model.name}.`,
  };
}

export default async function SkuPage({ params }: Props) {
  const { model_id } = await params;
  const supabase = await createClient();

  const { data: model } = await supabase
    .from("product_models")
    .select(
      "id, name, category, description, hero_image_url, product_url, launched_year",
    )
    .eq("id", model_id)
    .single();

  if (!model) notFound();

  // Two parallel aggregates:
  //   1. user_claimed_models — anchors the "users" count + "first claim ever"
  //   2. trips JOIN trip_claimed_models — every public trip tagged with this
  //      model, with author info for ranking and trip listing.
  const [{ data: claims }, { data: tripsRaw }] = await Promise.all([
    supabase
      .from("user_claimed_models")
      .select("user_id, first_claimed_at")
      .eq("model_id", model_id),
    supabase
      .from("trips")
      .select(
        `id, title, start_place_name, end_place_name, start_short_name, end_short_name, distance_km, cover_photo_url, start_lat, start_lng, end_lat, end_lng, country_codes, user_id, start_at,
         trip_claimed_models!inner(model_id),
         users(username, display_name, avatar_url)`,
      )
      .eq("trip_claimed_models.model_id", model_id)
      .eq("visibility", "public")
      .order("start_at", { ascending: false }),
  ]);

  type TripRow = {
    id: string;
    title: string | null;
    start_place_name: string | null;
    end_place_name: string | null;
    start_short_name: string | null;
    end_short_name: string | null;
    distance_km: number | null;
    cover_photo_url: string | null;
    start_lat: number | null;
    start_lng: number | null;
    end_lat: number | null;
    end_lng: number | null;
    country_codes: string[] | null;
    user_id: string;
    start_at: string | null;
    users: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  const trips = (tripsRaw ?? []) as unknown as TripRow[];

  // KPI aggregates
  const usersCount = (claims ?? []).length;
  const totalKm = trips.reduce((acc, t) => acc + (t.distance_km ?? 0), 0);
  const countries = new Set<string>();
  for (const t of trips) {
    for (const code of t.country_codes ?? []) {
      if (code) countries.add(code);
    }
  }
  const firstClaimAt = (claims ?? []).reduce<string | null>((min, c) => {
    if (!c.first_claimed_at) return min;
    if (!min) return c.first_claimed_at;
    return c.first_claimed_at < min ? c.first_claimed_at : min;
  }, null);

  // Top travelers: group trips by user, sum km.
  type TravelerStat = {
    userId: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    km: number;
    trips: number;
  };
  const byUser = new Map<string, TravelerStat>();
  for (const t of trips) {
    if (!t.users) continue;
    const entry = byUser.get(t.user_id) ?? {
      userId: t.user_id,
      username: t.users.username,
      displayName: t.users.display_name,
      avatarUrl: t.users.avatar_url,
      km: 0,
      trips: 0,
    };
    entry.km += t.distance_km ?? 0;
    entry.trips += 1;
    byUser.set(t.user_id, entry);
  }
  const topTravelers = [...byUser.values()]
    .sort((a, b) => b.km - a.km)
    .slice(0, 5);

  // Globe points — bucket by short place name (matches /u/[username] pattern).
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
    const tripMeta = {
      id: t.id,
      title: tripDisplayTitle(t),
      distanceKm: t.distance_km,
      coverPhotoUrl: t.cover_photo_url,
    };
    visit(t.start_short_name, t.start_lat, t.start_lng, tripMeta);
    visit(t.end_short_name, t.end_lat, t.end_lng, tripMeta);
  }
  const points: GlobePoint[] = Array.from(byPlace.values()).map((b) => ({
    lat: b.lat,
    lng: b.lng,
    name: b.name,
    trips: b.trips,
  }));

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-display text-xl font-black leading-none tracking-tight text-bone md:text-2xl">
            BØLG
          </span>
          <span className="text-[10px] uppercase tracking-[0.36em] text-bone/60">
            Atlas
          </span>
        </Link>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero with product image */}
        <section className="relative h-[44vh] min-h-[280px] w-full overflow-hidden bg-fog">
          {model.hero_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={model.hero_image_url}
              alt={model.name}
              className="h-full w-full object-cover"
              loading="eager"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </section>

        {/* Title + Shopify CTA */}
        <section className="-mt-20 px-6 md:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              {model.category && (
                <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/45">
                  {model.category}
                </span>
              )}
              <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
                {model.name}
              </h1>
              {model.description && (
                <p className="mt-2 max-w-xl text-base leading-relaxed text-foreground/70">
                  {model.description}
                </p>
              )}
            </div>
            {model.product_url && (
              <a
                href={model.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors"
              >
                Llevátelo
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </a>
            )}
          </div>
        </section>

        {/* KPIs */}
        <section className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-2 gap-y-8 border-t border-border px-6 pt-8 md:grid-cols-4 md:px-10">
          <Kpi value={usersCount} label="Usuarios" />
          <Kpi value={Math.round(totalKm)} label="Kilómetros" suffix="km" />
          <Kpi value={countries.size} label="Países" />
          <Kpi
            value={firstClaimAt ? new Date(firstClaimAt).getFullYear() : 0}
            label="Primer registro"
            raw
          />
        </section>

        {/* Mini-globe */}
        {points.length > 0 && (
          <section className="mx-auto mt-12 w-full max-w-3xl px-6 md:px-10">
            <Globe points={points} height="380px" />
          </section>
        )}

        {/* Top travelers */}
        {topTravelers.length > 0 && (
          <section className="mx-auto mt-16 flex w-full max-w-5xl flex-col gap-6 px-6 md:px-10">
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              Top viajeros con este modelo
            </span>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
              {topTravelers.map((t, i) => (
                <li key={t.userId}>
                  <Link
                    href={`/u/${t.username}`}
                    className="group flex items-center gap-3 border border-border p-3 hover:border-foreground/60 transition-colors"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/40">
                      #{i + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm">
                        {t.displayName ?? `@${t.username}`}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 tabular-nums">
                        {Math.round(t.km).toLocaleString("es-CL")} km · {t.trips}{" "}
                        {t.trips === 1 ? "viaje" : "viajes"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Public trips */}
        <section className="mx-auto mt-16 flex w-full max-w-5xl flex-col gap-6 px-6 pb-24 md:px-10">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              Viajes con {model.name} · {trips.length}
            </span>
            {model.product_url && (
              <a
                href={model.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
              >
                Lo quiero ↗
              </a>
            )}
          </div>
          {trips.length === 0 ? (
            <p className="font-mono text-sm text-foreground/55">
              Nadie ha subido un viaje público con este modelo aún. Sé el
              primero.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((t) => (
                <li key={t.id}>
                  <TripCard
                    trip={{
                      id: t.id,
                      title: t.title,
                      start_place_name: t.start_place_name,
                      end_place_name: t.end_place_name,
                      start_short_name: t.start_short_name,
                      end_short_name: t.end_short_name,
                      distance_km: t.distance_km,
                      cover_photo_url: t.cover_photo_url,
                      author: t.users
                        ? {
                            username: t.users.username,
                            display_name: t.users.display_name,
                          }
                        : null,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Kpi({
  value,
  label,
  suffix,
  raw,
}: {
  value: number;
  label: string;
  suffix?: string;
  raw?: boolean;
}) {
  const display = raw
    ? value === 0
      ? "—"
      : String(value)
    : value.toLocaleString("es-CL");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-bold tabular-nums tracking-tight md:text-4xl">
          {display}
        </span>
        {suffix && (
          <span className="font-mono text-xs text-foreground/40">{suffix}</span>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
        {label}
      </span>
    </div>
  );
}
