import type { Metadata } from "next";
import { ArrowRight, PencilLine, Plus, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { InstagramLink } from "@/components/instagram-link";
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

  // Force onboarding if still on the provisional username OR if the PIN
  // hasn't been set yet (mandatory since the PIN auth rollout).
  const { data: gateRow } = await supabase
    .from("users")
    .select("username, pin_hash")
    .eq("id", user.id)
    .single();
  if (
    isProvisionalUsername(gateRow?.username as string | null) ||
    !gateRow?.pin_hash
  ) {
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
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/atlas"
            className="hidden text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors sm:inline"
          >
            Atlas
          </Link>
          <Link
            href="/explorar"
            className="hidden text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors sm:inline"
          >
            Comunidad
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="-m-2 p-2 text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </nav>
      </header>

      <main className="flex flex-1 flex-col gap-10 px-6 pb-24 pt-6 sm:gap-12 sm:pt-8 md:px-10">
        {/* CTAs principales — siempre arriba del todo. Ver el atlas + subir
            viaje son los 2 caminos que el usuario quiere tomar al volver. */}
        <section className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="group flex flex-1 items-center justify-between gap-3 border-2 border-foreground bg-foreground px-5 py-4 text-background transition-colors hover:bg-foreground/90"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-[0.32em] opacity-70">
                Mapa global
              </span>
              <span className="font-display text-base font-black leading-none tracking-tight md:text-lg">
                Ver el Atlas
              </span>
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/trip/new"
            className="group flex flex-1 items-center justify-between gap-3 border-2 border-foreground/70 bg-card px-5 py-4 transition-colors hover:border-foreground hover:bg-foreground/[0.04]"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-[0.32em] text-foreground/55">
                Sumar km
              </span>
              <span className="font-display text-base font-black leading-none tracking-tight md:text-lg">
                Cargar viaje
              </span>
            </span>
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          </Link>
        </section>

        <section className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            Bienvenido
          </span>
          <h1 className="break-words font-display text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
            Hola, {profile?.display_name ?? user.email}.
          </h1>
          <p className="font-mono text-xs text-foreground/50 sm:text-sm">
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
              <InstagramLink handle={profile.instagram_handle} />
            )}
          </div>
        </section>

        {gear.length > 0 && (
          <section className="flex flex-col gap-3 pt-2">
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              Tu Equipaje BØLG
            </span>
            <ul className="flex flex-wrap gap-x-4 gap-y-3">
              {gear.map((m) => (
                <li key={m.id} className="w-[80px]">
                  <Link
                    href={`/sku/${m.id}`}
                    className="group flex flex-col gap-1.5"
                  >
                    <div className="h-[80px] w-[80px] overflow-hidden rounded-full border border-border bg-fog opacity-80 transition-opacity group-hover:opacity-100">
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
          <div className="flex flex-wrap items-baseline justify-between gap-3">
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
