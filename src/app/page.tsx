import type { Metadata } from "next";
import { AtlasClient } from "./atlas/AtlasClient";
import { loadAtlasV2Data } from "./atlas/loader";

export const metadata: Metadata = {
  title: "BØLG Atlas — Conquista el mundo con tu BØLG",
  description:
    "El mapa de conquista de la comunidad BØLG. Cada ciudad tiene un conquistador. Cada continente, una historia. Sé tú el siguiente.",
};

export default async function Home() {
  const data = await loadAtlasV2Data();
  return <AtlasClient {...data} />;
}
