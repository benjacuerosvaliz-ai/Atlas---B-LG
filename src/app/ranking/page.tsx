import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Crown } from "lucide-react";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ranking Mundial — BØLG Atlas",
  description:
    "El ranking de conquistadores BØLG. Por continentes, países y ciudades conquistadas.",
};

const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

type RankRow = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  continents: number;
  countries: number;
  cities: number;
  lastConquestAt: string | null;
};

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // user_conquest_stats es una view. Le hacemos JOIN con users (cliente)
  // para traer username + avatar.
  const { data: statsRaw } = await supabase
    .from("user_conquest_stats")
    .select(
      `user_id, cities_conquered, countries_with_conquest,
       continents_with_conquest, last_conquest_at,
       users(username, display_name, avatar_url)`,
    );

  type StatRow = {
    user_id: string;
    cities_conquered: number | null;
    countries_with_conquest: number | null;
    continents_with_conquest: number | null;
    last_conquest_at: string | null;
    users: {
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };

  const rows: RankRow[] = ((statsRaw ?? []) as unknown as StatRow[])
    .filter(
      (s) =>
        s.users?.username &&
        !PROVISIONAL_USERNAME_RE.test(s.users.username),
    )
    .map((s) => ({
      userId: s.user_id,
      username: s.users!.username!,
      displayName: s.users?.display_name ?? null,
      avatarUrl: s.users?.avatar_url ?? null,
      continents: s.continents_with_conquest ?? 0,
      countries: s.countries_with_conquest ?? 0,
      cities: s.cities_conquered ?? 0,
      lastConquestAt: s.last_conquest_at,
    }))
    // Tiebreaker: continents > countries > cities > earliest last_conquest_at
    .sort((a, b) => {
      if (a.continents !== b.continents) return b.continents - a.continents;
      if (a.countries !== b.countries) return b.countries - a.countries;
      if (a.cities !== b.cities) return b.cities - a.cities;
      // Ante empate total, gana quien llegó primero a su última conquista.
      const aTime = a.lastConquestAt ? new Date(a.lastConquestAt).getTime() : Infinity;
      const bTime = b.lastConquestAt ? new Date(b.lastConquestAt).getTime() : Infinity;
      return aTime - bTime;
    })
    .slice(0, 10);

  const isEmpty = rows.length === 0;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 transition-colors hover:text-foreground"
        >
          ← Mapa
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-10 px-6 pb-24 pt-4 md:px-10">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            La cima del Atlas
          </span>
          <h1 className="flex items-center gap-3 font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
            <Crown className="h-8 w-8 text-aurora md:h-10 md:w-10" aria-hidden />
            Ranking Mundial
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-foreground/65">
            Los conquistadores BØLG ordenados por continentes recorridos
            primero, luego países, luego ciudades. Ante empate total, gana
            quien llegó primero a su última conquista.
          </p>
        </section>

        <section className="mx-auto w-full max-w-4xl">
          {isEmpty ? (
            <EmptyState authed={!!user} />
          ) : (
            <ul className="flex flex-col border-t border-border">
              {rows.map((r, idx) => (
                <li key={r.userId}>
                  <Link
                    href={`/u/${r.username}`}
                    className="group grid grid-cols-[2rem_3rem_1fr_auto_auto_auto_1rem] items-center gap-3 border-b border-border/60 px-2 py-4 transition-colors hover:bg-foreground/[0.04] md:gap-6 md:px-4"
                  >
                    <span
                      className={
                        idx < 3
                          ? "font-display text-xl font-black tabular-nums text-aurora md:text-2xl"
                          : "font-mono text-sm tabular-nums text-foreground/45"
                      }
                    >
                      #{idx + 1}
                    </span>
                    <Avatar className="h-11 w-11 shrink-0 bg-fog">
                      {r.avatarUrl && (
                        <AvatarImage
                          src={r.avatarUrl}
                          alt={r.displayName ?? r.username}
                        />
                      )}
                      <AvatarFallback className="bg-fog text-xs font-black text-foreground/75">
                        {initialsFrom(r.displayName ?? r.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-base group-hover:text-foreground">
                        {r.displayName ?? `@${r.username}`}
                      </span>
                      <span className="truncate font-mono text-[10px] text-foreground/45">
                        @{r.username}
                      </span>
                    </div>
                    <Stat label="Cont" value={r.continents} />
                    <Stat label="Países" value={r.countries} />
                    <Stat label="Cdds" value={r.cities} />
                    <ChevronRight className="h-4 w-4 text-foreground/35 transition-colors group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!user && (
          <section className="mx-auto w-full max-w-4xl">
            <Link
              href="/login"
              className="group flex items-center justify-center gap-2 border border-foreground bg-foreground/[0.04] px-6 py-5 text-[10px] uppercase tracking-[0.32em] text-foreground transition-colors hover:bg-foreground/10"
            >
              Hazte parte de la comunidad
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="hidden flex-col items-end gap-0.5 text-right sm:flex">
      <span className="font-display text-lg font-black tabular-nums">
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-[0.28em] text-foreground/45">
        {label}
      </span>
    </div>
  );
}

function EmptyState({ authed }: { authed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 border border-border bg-card/40 px-6 py-12 text-center">
      <Crown className="h-12 w-12 text-foreground/30" aria-hidden />
      <h2 className="font-display text-2xl font-black tracking-tight">
        El podio está vacío.
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-foreground/60">
        Todavía nadie ha conquistado una ciudad con su BØLG. El primero
        que suba un viaje arranca el ranking en lo más alto.
      </p>
      <Link
        href={authed ? "/trip/new" : "/login"}
        className="mt-2 flex items-center gap-2 bg-foreground px-6 py-3 text-[10px] uppercase tracking-[0.28em] text-background transition-colors hover:bg-foreground/80"
      >
        {authed ? "Cargar mi primer viaje" : "Crear cuenta gratis"}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function initialsFrom(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "·"
  );
}
