import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BØLG Atlas — Conquista el mundo con tu BØLG";

// Anon client. OG fetchers (WhatsApp, X, etc.) no llevan cookies, así
// que tiramos contra el rol anon + RLS para exponer solo datos públicos.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

export default async function Image() {
  // Tres queries en paralelo:
  //   1) total km recorridos (suma de trips públicos)
  //   2) ciudades únicas conquistadas (city_visits distinct)
  //   3) total de conquistadores con username "real"
  const [tripsRes, cityVisitsRes, usersRes] = await Promise.all([
    supabase.from("trips").select("distance_km").eq("visibility", "public"),
    supabase.from("city_visits").select("city_id"),
    supabase.from("users").select("username"),
  ]);

  const totalKm = Math.round(
    (tripsRes.data ?? []).reduce(
      (sum: number, t: { distance_km: number | null }) =>
        sum + (t.distance_km ?? 0),
      0,
    ),
  );

  const cityIds = new Set<string>();
  for (const v of (cityVisitsRes.data ?? []) as { city_id: string | null }[]) {
    if (v.city_id) cityIds.add(v.city_id);
  }
  const totalCities = cityIds.size;

  const totalConquerors = ((usersRes.data ?? []) as { username: string | null }[])
    .filter((u) => u.username && !PROVISIONAL_USERNAME_RE.test(u.username))
    .length;

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
          position: "relative",
        }}
      >
        {/* Acentos aurora/ember — barras decorativas en bordes */}
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
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 360,
            height: 6,
            background: "#d4a373",
            display: "flex",
          }}
        />

        {/* Header: logo BØLG · Atlas */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            style={{
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            BØLG
          </span>
          <span
            style={{
              marginLeft: 18,
              fontSize: 14,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              opacity: 0.55,
            }}
          >
            Atlas
          </span>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        {/* Eyebrow */}
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
          El mapa de la comunidad
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            maxWidth: "90%",
          }}
        >
          <span style={{ display: "flex" }}>Conquista el mundo</span>
          <span style={{ display: "flex" }}>
            con tu <span style={{ color: "#d4a373", marginLeft: 24 }}>BØLG</span>
          </span>
        </div>

        {/* Cifra hero: ciudades conquistadas + stats */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            marginTop: 64,
            fontFamily: "monospace",
            gap: 80,
          }}
        >
          <Stat
            value={totalCities.toLocaleString("es-CL")}
            label="Ciudades"
            big
            accent="#5bc0be"
          />
          <Stat
            value={totalConquerors.toLocaleString("es-CL")}
            label="Conquistadores"
          />
          <Stat
            value={totalKm.toLocaleString("es-CL")}
            label="Kilómetros"
            suffix="km"
          />
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({
  value,
  label,
  suffix,
  big,
  accent,
}: {
  value: string;
  label: string;
  suffix?: string;
  big?: boolean;
  accent?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span
          style={{
            fontSize: big ? 88 : 48,
            fontWeight: 700,
            color: accent ?? "#f4f1ea",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {suffix && (
          <span style={{ marginLeft: 8, fontSize: 22, opacity: 0.5 }}>
            {suffix}
          </span>
        )}
      </div>
      <span
        style={{
          marginTop: 10,
          fontSize: 13,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          opacity: 0.55,
        }}
      >
        {label}
      </span>
    </div>
  );
}
