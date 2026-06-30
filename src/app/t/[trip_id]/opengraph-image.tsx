import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Viaje en BØLG Atlas";

// Anon client — OG fetchers (WhatsApp, X, etc.) no llevan cookies, así
// que usamos el rol anon + RLS para exponer solo datos públicos.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Params = { params: Promise<{ trip_id: string }> };

const ACTIVITY_LABELS: Record<string, string> = {
  hike: "Caminata",
  run: "Running",
  bike: "Bici",
  drive: "Auto",
  fly: "Vuelo",
  walk: "Caminar",
  climb: "Escalada",
  ski: "Ski",
};

type TripRow = {
  title: string | null;
  start_short_name: string | null;
  end_short_name: string | null;
  distance_km: number | null;
  activity_type: string | null;
  cover_photo_url: string | null;
  users:
    | {
        display_name: string | null;
        username: string;
      }
    | null;
};

function shortTitle(t: {
  title: string | null;
  start_short_name: string | null;
  end_short_name: string | null;
}): string {
  if (t.title) return t.title;
  const start = (t.start_short_name ?? "").trim();
  const end = (t.end_short_name ?? "").trim();
  if (end && end.toLowerCase() !== start.toLowerCase()) {
    return `${start} → ${end}`;
  }
  return start || "Viaje";
}

export default async function Image({ params }: Params) {
  const { trip_id } = await params;
  const { data: tripRaw } = await supabase
    .from("trips")
    .select(
      "title, start_short_name, end_short_name, distance_km, activity_type, cover_photo_url, users(display_name, username)",
    )
    .eq("id", trip_id)
    .eq("visibility", "public")
    .single();
  const trip = tripRaw as unknown as TripRow | null;

  const title = trip ? shortTitle(trip) : "Viaje";
  const km = trip?.distance_km ?? 0;
  const activity = ACTIVITY_LABELS[trip?.activity_type ?? ""] ?? "Aventura";
  const author = trip?.users
    ? trip.users.display_name ?? `@${trip.users.username}`
    : "";
  const username = trip?.users?.username ?? null;
  const cover = trip?.cover_photo_url ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#f4f1ea",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Cover photo fullbleed con overlay oscuro encima */}
        {cover && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt=""
              width={1200}
              height={630}
              style={{
                width: 1200,
                height: 630,
                objectFit: "cover",
              }}
            />
            {/* Overlay degradado para legibilidad */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                background:
                  "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.85) 65%, rgba(10,10,10,0.95) 100%)",
              }}
            />
          </div>
        )}

        {/* Borde aurora arriba */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#5bc0be",
            display: "flex",
          }}
        />

        {/* Contenido encima del cover */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: 80,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: "-0.02em",
              }}
            >
              BØLG
            </span>
            <span
              style={{
                marginLeft: 16,
                fontSize: 13,
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                opacity: 0.55,
              }}
            >
              Atlas
            </span>
          </div>

          <div style={{ display: "flex", flex: 1 }} />

          <div
            style={{
              display: "flex",
              fontSize: 16,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              color: "#5bc0be",
              marginBottom: 24,
            }}
          >
            {activity}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              maxWidth: "100%",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 32,
              fontFamily: "monospace",
              fontSize: 32,
              opacity: 0.85,
            }}
          >
            <span style={{ fontWeight: 700, color: "#d4a373" }}>
              {km.toLocaleString("es-CL")}
            </span>
            <span style={{ marginLeft: 8, fontSize: 22, opacity: 0.7 }}>km</span>
          </div>

          {/* Footer: Atlas BØLG · @username */}
          <div
            style={{
              display: "flex",
              marginTop: 40,
              paddingTop: 24,
              borderTop: "1px solid rgba(244,241,234,0.18)",
              alignItems: "center",
              fontSize: 18,
              fontFamily: "monospace",
              opacity: 0.7,
              letterSpacing: "0.04em",
            }}
          >
            <span>Atlas BØLG</span>
            {username && (
              <>
                <span style={{ margin: "0 16px", opacity: 0.5 }}>·</span>
                <span>@{username}</span>
              </>
            )}
            {author && username && author !== `@${username}` && (
              <>
                <span style={{ margin: "0 16px", opacity: 0.5 }}>·</span>
                <span style={{ fontFamily: "sans-serif" }}>{author}</span>
              </>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
