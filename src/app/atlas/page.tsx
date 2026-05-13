import type { Metadata } from "next";
import { AtlasClient } from "./AtlasClient";
import { loadAtlasData } from "./loader";

export const metadata: Metadata = {
  title: "Atlas — Las olas no se quedan quietas",
  description:
    "Todos los viajes públicos de la comunidad BØLG, en vivo, sobre el globo terráqueo.",
};

// /atlas keeps working as a stable URL even though the same content lives
// at `/` now. Sharing the loader keeps the two routes in lockstep.
export default async function AtlasPage() {
  const { initialTrips, topTravelers, authedUsername } = await loadAtlasData();
  return (
    <AtlasClient
      initialTrips={initialTrips}
      topTravelers={topTravelers}
      authedUsername={authedUsername}
    />
  );
}
