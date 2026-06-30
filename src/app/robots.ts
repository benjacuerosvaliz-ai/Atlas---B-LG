import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atlas.bolg.cl";

/**
 * robots.txt — Next 16 file convention.
 *
 * Bloqueamos áreas privadas (dashboard, settings, me, onboarding) y
 * admin/api para que Google no indexe estados parciales ni endpoints
 * que pueden requerir auth o devolver JSON.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/onboarding",
        "/dashboard",
        "/settings",
        "/me",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
