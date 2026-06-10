import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { createClient } from "@/lib/supabase/server";
import { MigrationClient, type LegacyTrip } from "./MigrationClient";

export const metadata: Metadata = {
  title: "Migrar viajes — Admin",
  description: "Migración manual de trips pre-v2 al modelo de conquista.",
};

// Lista admin-emails. Solo Benja entra acá.
const ADMIN_EMAILS = new Set(["benja.bolgen@gmail.com"]);

export default async function MigrateTripsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/migrar-viajes");
  if (!ADMIN_EMAILS.has(user.email ?? "")) {
    return <div className="p-10 font-mono text-sm">403 · No autorizado.</div>;
  }

  const { data: trips } = await supabase
    .from("trips")
    .select(
      `id, title, start_short_name, end_short_name, start_place_name,
       end_place_name, start_lat, start_lng, end_lat, end_lng, distance_km,
       start_at, user_id, counts_for_bolg,
       users(username, display_name)`,
    )
    .eq("migrated_to_v2", false)
    .order("start_at", { ascending: false });

  type TripRow = {
    id: string;
    title: string | null;
    start_short_name: string | null;
    end_short_name: string | null;
    start_place_name: string | null;
    end_place_name: string | null;
    start_lat: number | null;
    start_lng: number | null;
    end_lat: number | null;
    end_lng: number | null;
    distance_km: number | null;
    start_at: string | null;
    user_id: string;
    counts_for_bolg: boolean | null;
    users: { username: string; display_name: string | null } | null;
  };

  const legacyTrips: LegacyTrip[] = ((trips ?? []) as unknown as TripRow[]).map(
    (t) => ({
      id: t.id,
      title: t.title,
      startShortName: t.start_short_name,
      endShortName: t.end_short_name,
      startPlaceName: t.start_place_name,
      endPlaceName: t.end_place_name,
      startLat: t.start_lat,
      startLng: t.start_lng,
      endLat: t.end_lat,
      endLng: t.end_lng,
      distanceKm: t.distance_km,
      startAt: t.start_at,
      userId: t.user_id,
      countsForBolg: t.counts_for_bolg ?? false,
      username: t.users?.username ?? null,
      displayName: t.users?.display_name ?? null,
    }),
  );

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
          Admin · Migración
        </span>
      </header>

      <main className="flex flex-1 flex-col gap-10 px-6 pb-24 pt-4 md:px-10">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            Migrar viajes pre-v2
          </span>
          <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
            Reasignar viajes a ciudades.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-foreground/65">
            Cada viaje listado abajo tiene origen/destino free-form. Buscas
            la ciudad real en Mapbox y confirmas — eso crea las city_visits
            que cuentan para la conquista. Si el viaje tenía producto BØLG
            (counts_for_bolg), la visita queda como bolg_visible=true.
          </p>
        </section>

        <section className="mx-auto w-full max-w-4xl">
          <MigrationClient trips={legacyTrips} />
        </section>
      </main>
    </div>
  );
}
