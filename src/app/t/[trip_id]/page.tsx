import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_LABELS, type ActivityType } from "@/app/trip/new/types";

type Props = { params: Promise<{ trip_id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trip_id } = await params;
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("title, start_place_name, end_place_name, distance_km")
    .eq("id", trip_id)
    .single();
  if (!trip) return { title: "Viaje" };
  const route = trip.end_place_name
    ? `${trip.start_place_name} → ${trip.end_place_name}`
    : trip.start_place_name;
  return {
    title: trip.title ?? route,
    description: `${trip.distance_km} km en ${route}.`,
  };
}

export default async function TripPage({ params }: Props) {
  const { trip_id } = await params;
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select(
      "id, title, description, start_at, end_at, distance_km, elevation_gain_m, start_place_name, end_place_name, country_codes, activity_type, visibility, cover_photo_url",
    )
    .eq("id", trip_id)
    .single();

  if (!trip) notFound();

  const { data: photos } = await supabase
    .from("trip_photos")
    .select("url, ordering")
    .eq("trip_id", trip_id)
    .order("ordering");

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-display text-xl font-black leading-none tracking-tight md:text-2xl">
            BØLG
          </span>
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/50">
            Atlas
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-12 px-6 pb-24 pt-8 md:px-10">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            {trip.activity_type
              ? ACTIVITY_LABELS[trip.activity_type as ActivityType]
              : "Viaje"}
          </span>
          <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
            {trip.title ?? trip.start_place_name}
          </h1>
          <p className="font-mono text-sm text-foreground/55">
            {trip.start_at &&
              format(new Date(trip.start_at), "d 'de' MMMM, yyyy", {
                locale: es,
              })}
            {trip.end_at &&
              ` → ${format(new Date(trip.end_at), "d 'de' MMMM, yyyy", { locale: es })}`}
            <span className="px-2">·</span>
            <span className="tabular-nums">
              {(trip.distance_km ?? 0).toLocaleString("es-CL")} km
            </span>
            {trip.elevation_gain_m ? (
              <>
                <span className="px-2">·</span>
                <span className="tabular-nums">
                  +{trip.elevation_gain_m.toLocaleString("es-CL")} m D+
                </span>
              </>
            ) : null}
          </p>
          {trip.end_place_name && (
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/45">
              {trip.start_place_name}{" "}
              <span className="text-foreground/30">→</span> {trip.end_place_name}
            </p>
          )}
          {trip.description && (
            <p className="max-w-2xl text-base leading-relaxed text-foreground/70">
              {trip.description}
            </p>
          )}
        </section>

        {photos && photos.length > 0 && (
          <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-2 sm:grid-cols-2">
            {photos.map((p) => (
              <div
                key={p.url}
                className="aspect-[4/3] overflow-hidden bg-fog"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </section>
        )}

        <section className="mx-auto w-full max-w-3xl border-t border-border pt-6">
          <p className="font-mono text-xs text-foreground/45">
            Página completa de viaje (mapa, ruta, productos vinculados, likes,
            comentarios) llega en Sesión 4-6. Este es el placeholder mínimo
            que confirma que la persistencia funciona.
          </p>
        </section>
      </main>
    </div>
  );
}
