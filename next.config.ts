import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin workspace root al directorio del proyecto. Hay un package-lock.json
  // huérfano en ~/  que confundía a Turbopack al inferir el root.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
