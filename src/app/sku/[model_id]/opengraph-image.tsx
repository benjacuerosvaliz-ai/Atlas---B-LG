import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Modelo BØLG en el Atlas";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Params = { params: Promise<{ model_id: string }> };

export default async function Image({ params }: Params) {
  const { model_id } = await params;
  const [{ data: model }, { count: usersCount }] = await Promise.all([
    supabase
      .from("product_models")
      .select("name, category, hero_image_url")
      .eq("id", model_id)
      .single(),
    supabase
      .from("user_claimed_models")
      .select("*", { count: "exact", head: true })
      .eq("model_id", model_id),
  ]);

  const name = model?.name ?? "Producto BØLG";
  const category = (model?.category as string | null) ?? "";
  const heroUrl = (model?.hero_image_url as string | null) ?? null;
  const users = usersCount ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#f4f1ea",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left half: hero image */}
        <div
          style={{
            display: "flex",
            width: 540,
            height: "100%",
            background: "#1f1f1f",
          }}
        >
          {heroUrl && (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img
              src={heroUrl}
              width={540}
              height={630}
              style={{ objectFit: "cover" }}
            />
          )}
        </div>

        {/* Right half: text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: 80,
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

          {category && (
            <div
              style={{
                display: "flex",
                fontSize: 14,
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                opacity: 0.45,
                marginBottom: 20,
              }}
            >
              {category}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            {name}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 40,
              fontFamily: "monospace",
              fontSize: 28,
              opacity: 0.7,
            }}
          >
            <span style={{ fontWeight: 700 }}>{users}</span>
            <span style={{ marginLeft: 12, fontSize: 18, opacity: 0.6 }}>
              {users === 1 ? "cliente lo lleva" : "clientes lo llevan"}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
