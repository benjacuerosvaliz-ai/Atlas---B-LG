import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Top del Atlas — Ranking BØLG";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

type StatRow = {
  user_id: string;
  cities_conquered: number | null;
  countries_with_conquest: number | null;
  continents_with_conquest: number | null;
  last_conquest_at: string | null;
  users: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    total_km: number | null;
  } | null;
};

type Row = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  totalKm: number;
  continents: number;
  countries: number;
  cities: number;
  lastConquestAt: string | null;
};

export default async function Image() {
  const { data: statsRaw } = await supabase
    .from("user_conquest_stats")
    .select(
      `user_id, cities_conquered, countries_with_conquest,
       continents_with_conquest, last_conquest_at,
       users(username, display_name, avatar_url, total_km)`,
    );

  const rows: Row[] = ((statsRaw ?? []) as unknown as StatRow[])
    .filter(
      (s) =>
        s.users?.username && !PROVISIONAL_USERNAME_RE.test(s.users.username),
    )
    .map((s) => ({
      username: s.users!.username!,
      displayName: s.users?.display_name ?? `@${s.users!.username!}`,
      avatarUrl: s.users?.avatar_url ?? null,
      totalKm: s.users?.total_km ?? 0,
      continents: s.continents_with_conquest ?? 0,
      countries: s.countries_with_conquest ?? 0,
      cities: s.cities_conquered ?? 0,
      lastConquestAt: s.last_conquest_at,
    }))
    // Mismo orden que /ranking: continentes → países → ciudades → quien
    // llegó primero a su última conquista.
    .sort((a, b) => {
      if (a.continents !== b.continents) return b.continents - a.continents;
      if (a.countries !== b.countries) return b.countries - a.countries;
      if (a.cities !== b.cities) return b.cities - a.cities;
      const aT = a.lastConquestAt
        ? new Date(a.lastConquestAt).getTime()
        : Infinity;
      const bT = b.lastConquestAt
        ? new Date(b.lastConquestAt).getTime()
        : Infinity;
      return aT - bT;
    })
    .slice(0, 3);

  const now = new Date();
  const monthLabel = `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`;

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
          padding: 64,
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

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
          <span
            style={{
              fontSize: 13,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#d4a373",
              fontFamily: "monospace",
            }}
          >
            {monthLabel}
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
          }}
        >
          <span
            style={{
              display: "flex",
              fontSize: 14,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              color: "#5bc0be",
              marginBottom: 12,
            }}
          >
            La cima del Atlas
          </span>
          <span
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Top del Atlas
          </span>
        </div>

        {/* 3 cards horizontales */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 44,
            flex: 1,
            alignItems: "stretch",
          }}
        >
          {rows.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                border: "1px solid rgba(244,241,234,0.15)",
                fontSize: 28,
                opacity: 0.55,
              }}
            >
              El podio está vacío. Sé el primero.
            </div>
          ) : (
            rows.map((r, i) => <PodiumCard key={r.username} rank={i + 1} row={r} />)
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}

function PodiumCard({ rank, row }: { rank: number; row: Row }) {
  const accent = rank === 1 ? "#d4a373" : rank === 2 ? "#5bc0be" : "#f4f1ea";
  const initials = initialsFrom(row.displayName);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: "#1f1f1f",
        padding: 24,
        borderTop: `4px solid ${accent}`,
      }}
    >
      <span
        style={{
          display: "flex",
          fontFamily: "monospace",
          fontSize: 44,
          fontWeight: 900,
          color: accent,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        #{rank}
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "#0a0a0a",
          overflow: "hidden",
          marginTop: 18,
          border: `2px solid ${accent}`,
        }}
      >
        {row.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.avatarUrl}
            alt={row.displayName}
            width={116}
            height={116}
            style={{
              width: 116,
              height: 116,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span
            style={{
              display: "flex",
              fontSize: 44,
              fontWeight: 900,
              opacity: 0.7,
              letterSpacing: "-0.04em",
            }}
          >
            {initials}
          </span>
        )}
      </div>

      <span
        style={{
          display: "flex",
          marginTop: 18,
          fontSize: 24,
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {truncate(row.displayName, 22)}
      </span>
      <span
        style={{
          display: "flex",
          marginTop: 4,
          fontFamily: "monospace",
          fontSize: 13,
          opacity: 0.5,
        }}
      >
        @{truncate(row.username, 20)}
      </span>

      <div style={{ display: "flex", flex: 1 }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid rgba(244,241,234,0.12)",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: accent,
              lineHeight: 1,
            }}
          >
            {Math.round(row.totalKm).toLocaleString("es-CL")}
          </span>
          <span style={{ marginLeft: 6, fontSize: 16, opacity: 0.5 }}>km</span>
        </div>
        <span
          style={{
            display: "flex",
            marginTop: 10,
            fontSize: 11,
            opacity: 0.6,
            letterSpacing: "0.04em",
          }}
        >
          {row.continents} cont · {row.countries} países · {row.cities} cdds
        </span>
      </div>
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
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
