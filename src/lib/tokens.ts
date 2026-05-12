// BØLG brand tokens. Single source of truth for non-CSS contexts
// (Three.js materials, dynamic styles, JS calculations).
// Tailwind utilities (bg-ink, text-bone, font-display, etc.) live in src/app/globals.css under @theme.

export const palette = {
  ink: "#0a0a0a", // backgrounds primarios, tipografía hero
  bone: "#f4f1ea", // paper / secondary surfaces
  fog: "#1f1f1f", // cards sobre ink
  mist: "#e8e4dc", // hairlines, bordes
  ember: "#d4a373", // acento principal (parsimonia)
  aurora: "#5bc0be", // acento alternativo (productos legendary)
  blood: "#a8201a", // alertas / quiebres
} as const;

export type PaletteKey = keyof typeof palette;

// Niveles BØLG (concepto §6). Lookup por km acumulados.
export const levels = [
  { id: 1, title: "Aprendiz", minKm: 0, maxKm: 500 },
  { id: 2, title: "Caminante", minKm: 500, maxKm: 2_000 },
  { id: 3, title: "Drengr", minKm: 2_000, maxKm: 5_000 },
  { id: 4, title: "Nómada", minKm: 5_000, maxKm: 12_000 },
  { id: 5, title: "Skald", minKm: 12_000, maxKm: 30_000 },
  { id: 6, title: "Cartógrafo", minKm: 30_000, maxKm: 60_000 },
  { id: 7, title: "Hugin", minKm: 60_000, maxKm: 100_000 },
  { id: 8, title: "Yggdrasil", minKm: 100_000, maxKm: Number.POSITIVE_INFINITY },
] as const;

export type Level = (typeof levels)[number];

// Easing curve usado en todas las animaciones (Apple-like out-expo, per handoff).
// Tipado como tuple mutable para que framer-motion lo acepte sin casts.
export const easeOutExpo: [number, number, number, number] = [0.22, 1, 0.36, 1];
