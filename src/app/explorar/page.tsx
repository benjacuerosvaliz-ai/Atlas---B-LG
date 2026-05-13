import type { Metadata } from "next";
import Link from "next/link";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { createClient } from "@/lib/supabase/server";
import { ExploreClient, type UserLite } from "./ExploreClient";

export const metadata: Metadata = {
  title: "Explorar la comunidad",
  description:
    "Encuentra a otros clientes BØLG por nombre, username o ciudad. Mira sus perfiles públicos y sus aventuras.",
};

const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: usersRaw } = await supabase
    .from("users")
    .select(
      "id, username, display_name, city, level, total_km, avatar_url, instagram_handle",
    )
    .order("total_km", { ascending: false })
    .limit(500);

  // Hide users that haven't completed onboarding yet (still on the
  // provisional user_<hex> handle from the auth trigger).
  const users: UserLite[] = (usersRaw ?? [])
    .filter((u) => !PROVISIONAL_USERNAME_RE.test(u.username as string))
    .map((u) => ({
      id: u.id as string,
      username: u.username as string,
      displayName: (u.display_name as string | null) ?? null,
      city: (u.city as string | null) ?? null,
      level: (u.level as number | null) ?? 1,
      totalKm: (u.total_km as number | null) ?? 0,
      avatarUrl: (u.avatar_url as string | null) ?? null,
      instagram: (u.instagram_handle as string | null) ?? null,
    }));

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
        <Link
          href="/atlas"
          className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
        >
          Atlas global →
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-10 px-6 pb-24 pt-4 md:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            La comunidad
          </span>
          <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
            Encuentra a otros clientes BØLG.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-foreground/65">
            Busca por nombre, username o ciudad. Mira sus aventuras, sus
            kilómetros, sus medallas. La comunidad creciendo en vivo.
          </p>
        </div>

        <div className="mx-auto w-full max-w-5xl">
          <ExploreClient users={users} />
        </div>
      </main>
    </div>
  );
}
