import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Perfil en BØLG Atlas";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const LEVEL_TITLES: Record<number, string> = {
  1: "Aprendiz",
  2: "Caminante",
  3: "Drengr",
  4: "Nómada",
  5: "Skald",
  6: "Cartógrafo",
  7: "Hugin",
  8: "Yggdrasil",
};

type Params = { params: Promise<{ username: string }> };

export default async function Image({ params }: Params) {
  const { username } = await params;
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, username, level, total_km, city")
    .eq("username", username)
    .single();

  // Countries visited: distinct ISO codes across all public trips.
  let countries = 0;
  let trips = 0;
  if (profile?.username) {
    const { data: tripsRows } = await supabase
      .from("trips")
      .select("country_codes")
      .eq("user_id", await getUserId(profile.username))
      .eq("visibility", "public");
    if (tripsRows) {
      trips = tripsRows.length;
      const set = new Set<string>();
      for (const t of tripsRows) {
        for (const c of (t.country_codes as string[] | null) ?? []) {
          if (c) set.add(c);
        }
      }
      countries = set.size;
    }
  }

  const name = profile?.display_name ?? `@${username}`;
  const level = (profile?.level as number | null) ?? 1;
  const totalKm = (profile?.total_km as number | null) ?? 0;
  const levelTitle = LEVEL_TITLES[level] ?? "";

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
          Perfil
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "monospace",
            fontSize: 22,
            marginTop: 16,
            opacity: 0.5,
          }}
        >
          @{username}
          {profile?.city && (
            <>
              <span style={{ margin: "0 16px", opacity: 0.6 }}>·</span>
              {profile.city}
            </>
          )}
          <span style={{ margin: "0 16px", opacity: 0.6 }}>·</span>
          Nivel {level} · {levelTitle}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 56,
            fontFamily: "monospace",
          }}
        >
          <Stat value={Math.round(totalKm).toLocaleString("es-CL")} label="Kilómetros" suffix="km" />
          <Stat value={countries.toString()} label="Países" />
          <Stat value={trips.toString()} label="Aventuras" />
        </div>
      </div>
    ),
    { ...size },
  );
}

// Helper: fetch the user's id by username (needed for the trips query
// above; one extra round-trip but acceptable for an OG image).
async function getUserId(username: string): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();
  return (data?.id as string | null) ?? null;
}

function Stat({
  value,
  label,
  suffix,
}: {
  value: string;
  label: string;
  suffix?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginRight: 80,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span style={{ fontSize: 56, fontWeight: 700 }}>{value}</span>
        {suffix && (
          <span style={{ marginLeft: 8, fontSize: 22, opacity: 0.5 }}>
            {suffix}
          </span>
        )}
      </div>
      <span
        style={{
          marginTop: 8,
          fontSize: 14,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          opacity: 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
}
