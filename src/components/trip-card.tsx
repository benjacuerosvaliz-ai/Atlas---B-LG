import Link from "next/link";

export type TripCardData = {
  id: string;
  title: string | null;
  start_place_name: string | null;
  end_place_name: string | null;
  start_short_name: string | null;
  end_short_name: string | null;
  distance_km: number | null;
  cover_photo_url: string | null;
  /** Optional author. Rendered as a small "by @username" line — useful on
   *  surfaces that mix trips from different users (e.g. /sku/[model_id]). */
  author?: { username: string; display_name: string | null } | null;
};

export function TripCard({ trip }: { trip: TripCardData }) {
  const km = trip.distance_km ?? 0;
  // distance === 0 → recorrido dentro de la misma ciudad: no son "0 km",
  // son un viaje local. Mejor copy y no rompe la sensación de progreso.
  const isLocal = km === 0;
  return (
    <Link
      href={`/t/${trip.id}`}
      className="group relative flex flex-col gap-3 border border-border p-3 transition-all duration-200 hover:border-aurora/70 hover:shadow-[0_0_0_1px_rgba(91,192,190,0.25)] active:border-aurora/70 sm:p-4"
    >
      {trip.cover_photo_url ? (
        <div className="aspect-[4/3] overflow-hidden bg-fog">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trip.cover_photo_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-fog" />
      )}
      <div className="flex flex-col gap-1">
        <span className="break-words text-base leading-tight">
          {tripDisplayTitle(trip)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          {isLocal ? (
            <span>Local</span>
          ) : (
            <span className="tabular-nums">
              {km.toLocaleString("es-CL")} km
            </span>
          )}
          {trip.author && (
            <>
              <span className="px-2">·</span>
              <span>
                {trip.author.display_name ?? `@${trip.author.username}`}
              </span>
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

export function tripDisplayTitle(t: {
  title: string | null;
  start_place_name: string | null;
  end_place_name: string | null;
  start_short_name: string | null;
  end_short_name: string | null;
}): string {
  if (t.title) return t.title;
  const start = (
    t.start_short_name ?? t.start_place_name?.split(",")[0] ?? ""
  ).trim();
  const end = (
    t.end_short_name ?? t.end_place_name?.split(",")[0] ?? ""
  ).trim();
  if (end && end.toLowerCase() !== start.toLowerCase()) {
    return `${start} → ${end}`;
  }
  return start || "Sin título";
}
