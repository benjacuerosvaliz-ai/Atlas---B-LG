import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Viaje en BØLG Atlas";

// Anon client — OG fetchers (WhatsApp, Twitter, etc.) don't carry user
// cookies, so we use the anon role + RLS to expose only public data.
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
  const { data: trip } = await supabase
    .from("trips")
    .select(
      "title, start_short_name, end_short_name, distance_km, activity_type, users(display_name, username)",
    )
    .eq("id", trip_id)
    .eq("visibility", "public")
    .single();

  const title = trip ? shortTitle(trip) : "Viaje";
  const km = (trip?.distance_km as number | null) ?? 0;
  const activity =
    ACTIVITY_LABELS[trip?.activity_type as string] ?? "Aventura";
  const u = trip?.users as unknown as {
    display_name: string | null;
    username: string;
  } | null;
  const author = u ? u.display_name ?? `@${u.username}` : "";

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
          padding: 80,
          fontFamily: "sans-serif",
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
            opacity: 0.45,
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
            opacity: 0.7,
          }}
        >
          <span style={{ fontWeight: 700 }}>
            {km.toLocaleString("es-CL")}
          </span>
          <span style={{ marginLeft: 8, fontSize: 22, opacity: 0.6 }}>km</span>
          {author && (
            <>
              <span style={{ margin: "0 24px", opacity: 0.4 }}>·</span>
              <span style={{ fontFamily: "sans-serif", fontSize: 26 }}>
                {author}
              </span>
            </>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
