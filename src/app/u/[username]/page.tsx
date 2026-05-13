import {
  Award,
  Compass,
  Flag,
  Globe as GlobeIcon,
  Mountain,
  Repeat,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, type GlobePoint } from "@/components/globe/Globe";
import { InstagramLink } from "@/components/instagram-link";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { TripCard, tripDisplayTitle } from "@/components/trip-card";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { levels } from "@/lib/tokens";

type EarnedBadge = {
  id: string;
  name: string;
  description: string | null;
  rarity: string;
  earnedAt: string;
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  viajero_casual: Compass,
  trotamundos: GlobeIcon,
  andino: Mountain,
  hemisferios: GlobeIcon,
  aurora: Sparkles,
  antipoda: Repeat,
  first_mover: Flag,
  equinoccio: Sun,
};

const RARITY_CLASS: Record<string, string> = {
  common: "text-foreground/55",
  rare: "text-ember",
  epic: "text-aurora",
  legendary: "text-ember font-bold",
};

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, total_km")
    .eq("username", username)
    .single();
  if (!profile) return { title: "Perfil no encontrado" };
  return {
    title: profile.display_name ?? `@${username}`,
    description: `${(profile.total_km ?? 0).toLocaleString("es-CL")} km recorridos en el Atlas BØLG.`,
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, username, display_name, bio, city, country_code, level, total_km, instagram_handle, avatar_url, cover_url, created_at",
    )
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const [
    { data: tripsRaw },
    { data: gearRaw },
    { data: badgesRaw },
    {
      data: { user: viewer },
    },
  ] = await Promise.all([
    supabase
      .from("trips")
      .select(
        "id, title, start_place_name, end_place_name, start_short_name, end_short_name, distance_km, cover_photo_url, start_lat, start_lng, end_lat, end_lng, country_codes, start_at",
      )
      .eq("user_id", profile.id)
      .eq("visibility", "public")
      .order("start_at", { ascending: false }),
    supabase
      .from("user_claimed_models")
      .select(
        "first_claimed_at, product_models(id, name, hero_image_url, product_url)",
      )
      .eq("user_id", profile.id)
      .order("first_claimed_at", { ascending: false }),
    supabase
      .from("user_badges")
      .select("earned_at, badges(id, name, description, rarity)")
      .eq("user_id", profile.id)
      .order("earned_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const trips = tripsRaw ?? [];

  // KPI: distinct countries across all trip country_codes arrays.
  const countries = new Set<string>();
  for (const t of trips) {
    for (const code of t.country_codes ?? []) {
      if (code) countries.add(code as string);
    }
  }

  // Globe points: group every trip endpoint by short place name. Same
  // location (e.g. two trips that both started in Santiago) collapses to
  // a single dot on the globe; clicking it reveals all of them.
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
    const key = name;
    if (!byPlace.has(key)) {
      byPlace.set(key, {
        lat,
        lng,
        name,
        tripIds: new Set(),
        trips: [],
      });
    }
    const b = byPlace.get(key)!;
    if (!b.tripIds.has(trip.id)) {
      b.tripIds.add(trip.id);
      b.trips.push(trip);
    }
  }
  for (const t of trips) {
    const tripMeta = {
      id: t.id as string,
      title: tripDisplayTitle(t),
      distanceKm: (t.distance_km as number | null) ?? null,
      coverPhotoUrl: (t.cover_photo_url as string | null) ?? null,
    };
    visit(
      (t.start_short_name as string | null) ?? null,
      t.start_lat as number | null,
      t.start_lng as number | null,
      tripMeta,
    );
    visit(
      (t.end_short_name as string | null) ?? null,
      t.end_lat as number | null,
      t.end_lng as number | null,
      tripMeta,
    );
  }
  const points: GlobePoint[] = Array.from(byPlace.values()).map((b) => ({
    lat: b.lat,
    lng: b.lng,
    name: b.name,
    trips: b.trips,
  }));

  type GearRow = {
    product_models: {
      id: string;
      name: string;
      hero_image_url: string | null;
      product_url: string | null;
    } | null;
  };
  const gear = ((gearRaw ?? []) as unknown as GearRow[])
    .map((r) => r.product_models)
    .filter((m): m is NonNullable<GearRow["product_models"]> => Boolean(m));

  type BadgeRow = {
    earned_at: string;
    badges: {
      id: string;
      name: string;
      description: string | null;
      rarity: string;
    } | null;
  };
  const badges = ((badgesRaw ?? []) as unknown as BadgeRow[])
    .filter((b) => b.badges)
    .map((b) => ({
      id: b.badges!.id,
      name: b.badges!.name,
      description: b.badges!.description,
      rarity: b.badges!.rarity,
      earnedAt: b.earned_at,
    }));

  const levelInfo = levels.find((l) => l.id === (profile.level ?? 1));
  const nameForInitials = String(
    profile.display_name ?? profile.username ?? "",
  );
  const initials = nameForInitials
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const coverUrl =
    (profile.cover_url as string | null) ?? trips[0]?.cover_photo_url ?? null;

  const isSelf = viewer?.id === profile.id;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
        {isSelf && (
          <Link
            href="/dashboard"
            className="text-[10px] uppercase tracking-[0.28em] text-bone/70 hover:text-bone transition-colors"
          >
            Dashboard →
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero cover */}
        <section className="relative h-[44vh] min-h-[280px] w-full overflow-hidden bg-fog">
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </section>

        {/* Profile head */}
        <section className="-mt-20 px-6 md:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            <Avatar className="h-24 w-24 border border-mist/30 bg-fog">
              {profile.avatar_url && (
                <AvatarImage
                  src={profile.avatar_url as string}
                  alt={profile.display_name ?? profile.username ?? ""}
                />
              )}
              <AvatarFallback className="bg-fog font-display text-2xl font-black text-foreground/80">
                {initials || "·"}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2">
              <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
                {profile.display_name ?? `@${profile.username}`}
              </h1>
              <p className="font-mono text-sm text-foreground/55">
                @{profile.username}
                {profile.city && (
                  <>
                    <span className="px-2">·</span>
                    {profile.city}
                  </>
                )}
                <span className="px-2">·</span>
                Nivel {profile.level ?? 1}
                <span className="px-2">·</span>
                {levelInfo?.title ?? ""}
              </p>
              {profile.instagram_handle && (
                <InstagramLink handle={profile.instagram_handle as string} />
              )}
              {profile.bio && (
                <p className="mt-2 max-w-xl text-base leading-relaxed text-foreground/75">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-2 gap-y-8 border-t border-border px-6 pt-8 md:grid-cols-4 md:px-10">
          <Kpi value={profile.total_km ?? 0} label="Kilómetros" suffix="km" />
          <Kpi value={countries.size} label="Países" />
          <Kpi value={trips.length} label="Viajes" />
          <Kpi value={gear.length} label="Equipaje" />
        </section>

        {/* Mini-globe */}
        {points.length > 0 && (
          <section className="mx-auto mt-12 w-full max-w-3xl px-6 md:px-10">
            <Globe points={points} height="380px" cameraDistance={3.6} />
          </section>
        )}

        {/* Tabs */}
        <section className="mx-auto mt-16 w-full max-w-5xl px-6 pb-24 md:px-10">
          <Tabs defaultValue="trips" className="flex flex-col gap-8">
            <TabsList variant="line">
              <TabsTrigger value="trips">
                <span className="text-[10px] uppercase tracking-[0.28em]">
                  Viajes · {trips.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="gear">
                <span className="text-[10px] uppercase tracking-[0.28em]">
                  Equipaje · {gear.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="badges">
                <span className="text-[10px] uppercase tracking-[0.28em]">
                  Medallas · {badges.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trips">
              {trips.length === 0 ? (
                <p className="font-mono text-sm text-foreground/50">
                  Aún no hay viajes públicos en este perfil.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {trips.map((t) => (
                    <li key={t.id}>
                      <TripCard trip={t} />
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="gear">
              {gear.length === 0 ? (
                <p className="font-mono text-sm text-foreground/50">
                  Sin equipaje BØLG vinculado todavía.
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                  {gear.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/sku/${m.id}`}
                        className="group flex flex-col gap-2"
                      >
                        <div className="aspect-square overflow-hidden rounded-full border border-border bg-fog">
                          {m.hero_image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.hero_image_url}
                              alt={m.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <span className="text-xs leading-tight">{m.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="badges">
              {badges.length === 0 ? (
                <p className="font-mono text-sm text-foreground/50">
                  Aún sin medallas. Cada viaje nuevo puede desbloquear una.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {badges.map((b) => (
                    <li key={b.id}>
                      <BadgeCard badge={b} />
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}

function BadgeCard({ badge }: { badge: EarnedBadge }) {
  const Icon = BADGE_ICONS[badge.id] ?? Award;
  const rarityCls = RARITY_CLASS[badge.rarity] ?? "text-foreground/55";
  return (
    <div className="flex flex-col gap-3 border border-border p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-6 w-6 text-foreground/70" aria-hidden />
        <span
          className={cn(
            "font-mono text-[9px] uppercase tracking-[0.28em]",
            rarityCls,
          )}
        >
          {badge.rarity}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg font-black leading-tight tracking-tight">
          {badge.name}
        </h3>
        {badge.description && (
          <p className="text-xs leading-relaxed text-foreground/55">
            {badge.description}
          </p>
        )}
      </div>
    </div>
  );
}

function Kpi({
  value,
  label,
  suffix,
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-bold tabular-nums tracking-tight md:text-4xl">
          {value.toLocaleString("es-CL")}
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
