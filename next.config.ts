import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin workspace root al directorio del proyecto. Hay un package-lock.json
  // huérfano en ~/  que confundía a Turbopack al inferir el root.
  turbopack: {
    root: import.meta.dirname,
  },

  // Headers de seguridad básicos a todas las rutas.
  // CSP va en Report-Only — loguea violations al endpoint /api/csp-report
  // sin bloquear nada. Apretarla a enforcing una vez que el report endpoint
  // confirme que no hay falsos positivos en producción.
  async headers() {
    // Policy razonable para Next 16 + Supabase + Mapbox + Cloudinary +
    // react-simple-maps (carga topojson desde jsdelivr).
    // 'unsafe-inline' + 'unsafe-eval' en script-src son necesarios mientras
    // Next emita inline bootstrap chunks y RSC payloads; al pasar a enforcing
    // se debe migrar a nonces (ver app/guides/content-security-policy).
    const cspReportOnly = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com https://*.tile.openstreetmap.org https://api.mapbox.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://res.cloudinary.com https://cdn.jsdelivr.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "report-uri /api/csp-report",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
