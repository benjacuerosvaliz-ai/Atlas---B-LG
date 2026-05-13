import type { Metadata } from "next";
import { AtlasClient } from "./atlas/AtlasClient";
import { loadAtlasData } from "./atlas/loader";

export const metadata: Metadata = {
  title: "BØLG Atlas — Las olas no se quedan quietas",
  description:
    "El mapa en vivo de la comunidad BØLG: todas las personas que han viajado con nuestros productos, los kilómetros que llevan y los países que han pisado.",
};

// Landing = immersive globe. Marketing copy + onboarding explainer moved
// to /sobre and reachable from a discreet "¿Primera vez?" link in the
// globe header.
export default async function Home() {
  const { initialTrips, topTravelers, authedUsername } = await loadAtlasData();
  return (
    <AtlasClient
      initialTrips={initialTrips}
      topTravelers={topTravelers}
      authedUsername={authedUsername}
    />
  );
}
