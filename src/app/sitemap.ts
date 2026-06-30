import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * Sitemap dinámico — Next 16 file convention.
 *
 * Estáticas: páginas marketing + onboarding públicas.
 * Dinámicas: top 100 perfiles por total_km y top 50 viajes públicos
 *   más recientes. No sirve listar todos los perfiles ni viajes (gastamos
 *   crawl budget y arrastra cuentas inactivas); los topes son la cara
 *   pública que queremos que Google indexe primero.
 *
 * Excluimos rutas privadas y de área autenticada (/dashboard, /me,
 * /settings, /onboarding, /admin, /api) — esas viven en robots.ts.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atlas.bolg.cl";

/** Usernames provisionales generados por el server al hacer signup —
 * mismo regex que el ranking, no queremos indexarlos. */
const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/atlas`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/ranking`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/premio`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // --- Top 100 perfiles por total_km ---
  // Si falla la query no rompemos el sitemap completo: caemos a estáticas.
  const { data: topUsers } = await supabase
    .from("users")
    .select("username, updated_at, created_at, total_km")
    .order("total_km", { ascending: false, nullsFirst: false })
    .limit(100);

  type UserRow = {
    username: string | null;
    updated_at: string | null;
    created_at: string | null;
    total_km: number | null;
  };

  const userRoutes: MetadataRoute.Sitemap = ((topUsers ?? []) as UserRow[])
    .filter(
      (u): u is UserRow & { username: string } =>
        Boolean(u.username) && !PROVISIONAL_USERNAME_RE.test(u.username!),
    )
    .map((u) => ({
      url: `${BASE_URL}/u/${u.username}`,
      lastModified: parseDate(u.updated_at ?? u.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // --- Top 50 viajes públicos por created_at desc ---
  const { data: topTrips } = await supabase
    .from("trips")
    .select("id, updated_at, created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50);

  type TripRow = {
    id: string;
    updated_at: string | null;
    created_at: string | null;
  };

  const tripRoutes: MetadataRoute.Sitemap = ((topTrips ?? []) as TripRow[]).map(
    (t) => ({
      url: `${BASE_URL}/t/${t.id}`,
      lastModified: parseDate(t.updated_at ?? t.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
  );

  return [...staticRoutes, ...userRoutes, ...tripRoutes];
}

function parseDate(raw: string | null): Date {
  if (!raw) return new Date();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
