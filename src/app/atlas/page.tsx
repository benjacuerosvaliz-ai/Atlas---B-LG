import type { Metadata } from "next";
import { AtlasClient } from "./AtlasClient";
import { loadAtlasV2Data } from "./loader";

export const metadata: Metadata = {
  title: "Atlas — Conquista el mundo con tu BØLG",
  description:
    "Mapa de conquista de la comunidad BØLG en vivo.",
};

export default async function AtlasPage() {
  const data = await loadAtlasV2Data();
  return <AtlasClient {...data} />;
}
