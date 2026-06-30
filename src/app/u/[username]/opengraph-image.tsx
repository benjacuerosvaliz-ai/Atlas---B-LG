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

type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string;
  level: number | null;
  total_km: number | null;
  city: string | null;
  avatar_url: string | null;
};

export default async function Image({ params }: Params) {
  const { username } = await params;
  const { data: profileRaw } = await supabase
    .from("users")
    .select("id, display_name, username, level, total_km, city, avatar_url")
    .eq("username", username)
    .single();
  const profile = profileRaw as ProfileRow | null;

  // Ciudades únicas a partir de trips públicos (count de city_visits)
  // y países distintos (country_codes en trips).
  let cities = 0;
  let countries = 0;
  if (profile?.id) {
    const [tripsRes, visitsRes] = await Promise.all([
      supabase
        .from("trips")
        .select("country_codes")
        .eq("user_id", profile.id)
        .eq("visibility", "public"),
      supabase.from("city_visits").select("city_id").eq("user_id", profile.id),
    ]);

    const set = new Set<string>();
    for (const t of (tripsRes.data ?? []) as { country_codes: string[] | null }[]) {
      for (const c of t.country_codes ?? []) {
        if (c) set.add(c);
      }
    }
    countries = set.size;

    const citySet = new Set<string>();
    for (const v of (visitsRes.data ?? []) as { city_id: string | null }[]) {
      if (v.city_id) citySet.add(v.city_id);
    }
    cities = citySet.size;
  }

  const name = profile?.display_name ?? `@${username}`;
  const level = profile?.level ?? 1;
  const totalKm = profile?.total_km ?? 0;
  const levelTitle = LEVEL_TITLES[level] ?? "";
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = initialsFrom(name);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#f4f1ea",
          padding: 72,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
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

        {/* Columna izquierda: avatar circular grande */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 380,
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 340,
              height: 340,
              borderRadius: "50%",
              border: "4px solid #5bc0be",
              overflow: "hidden",
              background: "#1f1f1f",
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                width={332}
                height={332}
                style={{
                  width: 332,
                  height: 332,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span
                style={{
                  display: "flex",
                  fontSize: 132,
                  fontWeight: 900,
                  color: "#f4f1ea",
                  opacity: 0.7,
                  letterSpacing: "-0.04em",
                }}
              >
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Columna derecha: header + nombre + stats */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            paddingLeft: 56,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em" }}>
              BØLG
            </span>
            <span
              style={{
                marginLeft: 14,
                fontSize: 11,
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                opacity: 0.55,
              }}
            >
              Atlas
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 13,
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                color: "#5bc0be",
                marginBottom: 18,
              }}
            >
              Conquistador BØLG
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 82,
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
                fontSize: 20,
                marginTop: 14,
                opacity: 0.55,
              }}
            >
              @{username}
              <span style={{ margin: "0 14px", opacity: 0.6 }}>·</span>
              Nivel {level} · {levelTitle}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              gap: 56,
            }}
          >
            <Stat
              value={Math.round(totalKm).toLocaleString("es-CL")}
              label="Kilómetros"
              suffix="km"
              accent="#d4a373"
            />
            <Stat value={cities.toString()} label="Ciudades" />
            <Stat value={countries.toString()} label="Países" />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function initialsFrom(name: string): string {
  return (
    name
      .replace(/^@/, "")
      .split(/[\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "·"
  );
}

function Stat({
  value,
  label,
  suffix,
  accent,
}: {
  value: string;
  label: string;
  suffix?: string;
  accent?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: accent ?? "#f4f1ea",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {suffix && (
          <span style={{ marginLeft: 8, fontSize: 20, opacity: 0.5 }}>
            {suffix}
          </span>
        )}
      </div>
      <span
        style={{
          marginTop: 8,
          fontSize: 12,
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
