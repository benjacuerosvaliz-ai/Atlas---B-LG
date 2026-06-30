import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin workspace root al directorio del proyecto. Hay un package-lock.json
  // huérfano en ~/  que confundía a Turbopack al inferir el root.
  turbopack: {
    root: import.meta.dirname,
  },

  // Headers de seguridad básicos a todas las rutas.
  // CSP queda fuera a propósito — es invasivo (mapbox, supabase, cloudinary,
  // three.js, framer-motion, etc.) y requiere auditar caso por caso.
  async headers() {
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
        ],
      },
    ];
  },
};

export default nextConfig;
