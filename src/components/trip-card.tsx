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
  return (
    <Link
      href={`/t/${trip.id}`}
      className="group flex flex-col gap-3 border border-border p-3 transition-colors hover:border-foreground/60 active:border-foreground/60 sm:p-4"
    >
      {trip.cover_photo_url ? (
        <div className="aspect-[4/3] overflow-hidden bg-fog">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trip.cover_photo_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
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
          <span className="tabular-nums">
            {(trip.distance_km ?? 0).toLocaleString("es-CL")} km
          </span>
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
