import type { Metadata } from "next";
import { ExternalLink, PencilLine, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { TripCard } from "@/components/trip-card";
import { isProvisionalUsername } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { levels } from "@/lib/tokens";
import { signOut } from "../login/actions";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tu dashboard BØLG Atlas.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Force onboarding if still on the provisional username — happens after
  // the very first magic-link signup before they pick a real handle.
  const { data: usernameRow } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();
  if (isProvisionalUsername(usernameRow?.username as string | null)) {
    redirect("/onboarding");
  }

  const [{ data: profile }, { data: trips }, { data: collection }] =
    await Promise.all([
      supabase
        .from("users")
        .select("username, display_name, total_km, level, instagram_handle")
        .eq("id", user.id)
        .single(),
      supabase
        .from("trips")
        .select(
          "id, title, start_place_name, end_place_name, start_short_name, end_short_name, start_at, distance_km, activity_type, cover_photo_url",
        )
        .eq("user_id", user.id)
        .order("start_at", { ascending: false })
        .limit(6),
      supabase
        .from("user_claimed_models")
        .select(
          "first_claimed_at, product_models(id, name, hero_image_url, product_url)",
        )
        .eq("user_id", user.id)
        .order("first_claimed_at", { ascending: false }),
    ]);

  type CollectionRow = {
    product_models: {
      id: string;
      name: string;
      hero_image_url: string | null;
      product_url: string | null;
    } | null;
  };
  const gear = ((collection ?? []) as unknown as CollectionRow[])
    .map((r) => r.product_models)
    .filter((m): m is NonNullable<CollectionRow["product_models"]> =>
      Boolean(m),
    );

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
        <form action={signOut}>
          <button
            type="submit"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col gap-12 px-6 pb-24 pt-8 md:px-10">
        <section className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            Bienvenido
          </span>
          <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
            Hola, {profile?.display_name ?? user.email}.
          </h1>
          <p className="font-mono text-sm text-foreground/50">
            {profile?.username ? (
              <Link
                href={`/u/${profile.username}`}
                className="hover:text-foreground transition-colors"
              >
                @{profile.username}
              </Link>
            ) : (
              "—"
            )}
            <span className="px-2">·</span>
            Nivel {profile?.level ?? 1}
            <span className="px-2">·</span>
            {levels.find((l) => l.id === (profile?.level ?? 1))?.title ?? ""}
            <span className="px-2">·</span>
            <span className="tabular-nums">
              {(profile?.total_km ?? 0).toLocaleString("es-CL")} km
            </span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
            {profile?.username && (
              <Link
                href={`/u/${profile.username}`}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
              >
                <User className="h-3 w-3" aria-hidden />
                Mi perfil
              </Link>
            )}
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
            >
              <PencilLine className="h-3 w-3" aria-hidden />
              Editar perfil
            </Link>
            {profile?.instagram_handle && (
              <a
                href={`https://instagram.com/${profile.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
              >
                IG · @{profile.instagram_handle}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </div>
        </section>

        {gear.length > 0 && (
          <section className="flex flex-col gap-3 pt-2">
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              Tu Gear BØLG
            </span>
            <ul className="flex flex-wrap gap-x-4 gap-y-3">
              {gear.map((m) => (
                <li key={m.id} className="w-[80px]">
                  <Link
                    href={`/sku/${m.id}`}
                    className="group flex flex-col gap-1.5"
                  >
                    <div className="h-[80px] w-[80px] overflow-hidden bg-fog opacity-80 transition-opacity group-hover:opacity-100">
                      {m.hero_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.hero_image_url}
                          alt={m.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <span className="block text-[11px] leading-tight text-foreground/65 group-hover:text-foreground transition-colors">
                      {m.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-6 border-t border-border pt-8">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              Tus viajes
            </span>
            <Link
              href="/trip/new"
              className="bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors"
            >
              Nuevo viaje →
            </Link>
          </div>

          {!trips || trips.length === 0 ? (
            <p className="max-w-md font-mono text-sm leading-relaxed text-foreground/55">
              Aún no has subido ningún viaje. Empieza por el primero — Pucón,
              el Cajón del Maipo, una caminata por La Reina. Lo que sea cuenta.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((t) => (
                <li key={t.id}>
                  <TripCard trip={t} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
