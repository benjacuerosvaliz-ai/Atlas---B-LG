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

  const [{ data: photos }, { data: claimed }] = await Promise.all([
    supabase
      .from("trip_photos")
      .select("url, ordering")
      .eq("trip_id", trip_id)
      .order("ordering"),
    supabase
      .from("trip_claimed_models")
      .select("model_id, product_models(id, name, hero_image_url, product_url)")
      .eq("trip_id", trip_id),
  ]);

  type ClaimedRow = {
    product_models: {
      id: string;
      name: string;
      hero_image_url: string | null;
      product_url: string | null;
    } | null;
  };
  const claimedModels = ((claimed ?? []) as unknown as ClaimedRow[])
    .map((r) => r.product_models)
    .filter((m): m is NonNullable<ClaimedRow["product_models"]> => Boolean(m));

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

        {claimedModels.length > 0 && (
          <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 border-t border-border pt-8">
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              BØLG en este viaje
            </span>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {claimedModels.map((m) => (
                <li key={m.id}>
                  <a
                    href={m.product_url ?? "#"}
                    target={m.product_url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-2"
                  >
                    <div className="aspect-square overflow-hidden bg-fog">
                      {m.hero_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.hero_image_url}
                          alt={m.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                    <span className="text-sm leading-tight">{m.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mx-auto w-full max-w-3xl border-t border-border pt-6">
          <p className="font-mono text-xs text-foreground/45">
            Página completa de viaje (mapa, ruta, likes, comentarios) llega en
            Sesión 4-6. Este es el placeholder que confirma persistencia +
            claims.
          </p>
        </section>
      </main>
    </div>
  );
}
