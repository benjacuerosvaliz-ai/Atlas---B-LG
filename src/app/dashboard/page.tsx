import type { Metadata } from "next";
import {
  ArrowRight,
  Compass,
  MapPin,
  PencilLine,
  Plus,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { InstagramLink } from "@/components/instagram-link";
import { TripCard } from "@/components/trip-card";
import { BOLG_100, matchBolg100 } from "@/lib/bolg-100";
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

  const [
    { data: profile },
    { data: trips },
    { data: collection },
    { data: statsRaw },
    { data: allTrips },
  ] = await Promise.all([
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
    // Stats globales del conquistador. Es una view; si aún no tiene filas
    // (user sin conquistas), todo cae a 0.
    supabase
      .from("user_conquest_stats")
      .select(
        "cities_conquered, countries_with_conquest, continents_with_conquest",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    // Lat/lng de TODOS los viajes — los usamos para (1) saber qué BØLG-100
    // ya conquistó y (2) elegir el destino sugerido más cercano al
    // centroide de su mapa actual. Solo lat/lng + start_at, payload chico.
    supabase
      .from("trips")
      .select("start_lat, start_lng, end_lat, end_lng, start_at")
      .eq("user_id", user.id)
      .order("start_at", { ascending: false }),
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

  // ── Stats command-center ─────────────────────────────────────────────
  // user_conquest_stats puede no tener fila aún (user sin city_visits).
  // En ese caso todo es 0 — el dashboard sigue funcionando, solo más vacío.
  const stats = {
    km: profile?.total_km ?? 0,
    cities: statsRaw?.cities_conquered ?? 0,
    countries: statsRaw?.countries_with_conquest ?? 0,
    continents: statsRaw?.continents_with_conquest ?? 0,
  };

  // ── Próximo destino BØLG sugerido ────────────────────────────────────
  // Lógica: 1) identificar qué BØLG-100 YA tocó (cualquier viaje a ≤80km
  // de un destino lo cuenta como conquistado). 2) calcular el centroide
  // del mapa del user (promedio de todos sus endpoints lat/lng). 3) elegir
  // el destino no-conquistado más cercano a ese centroide. Si el user
  // no tiene viajes todavía, sugerimos un random — pero priorizando
  // Pucón/Atacama/Natales como entrada chilena natural.
  const tripCoords: Array<[number, number]> = [];
  const conqueredIds = new Set<string>();
  for (const t of allTrips ?? []) {
    const sLat = t.start_lat as number | null;
    const sLng = t.start_lng as number | null;
    const eLat = t.end_lat as number | null;
    const eLng = t.end_lng as number | null;
    if (typeof sLat === "number" && typeof sLng === "number") {
      tripCoords.push([sLat, sLng]);
      const hit = matchBolg100(sLat, sLng);
      if (hit) conqueredIds.add(hit.id);
    }
    if (typeof eLat === "number" && typeof eLng === "number") {
      tripCoords.push([eLat, eLng]);
      const hit = matchBolg100(eLat, eLng);
      if (hit) conqueredIds.add(hit.id);
    }
  }

  const unclaimed = BOLG_100.filter((d) => !conqueredIds.has(d.id));
  function pickSuggested() {
    if (unclaimed.length === 0) return null;
    if (tripCoords.length === 0) {
      // User sin viajes: ofrecemos un primer paso clásico chileno.
      const seeds = ["pucon", "atacama", "natales", "valpo"];
      const seedHits = unclaimed.filter((d) => seeds.includes(d.id));
      if (seedHits.length > 0) {
        return seedHits[Math.floor(Math.random() * seedHits.length)];
      }
      return unclaimed[Math.floor(Math.random() * unclaimed.length)];
    }
    // Centroide simple (promedio aritmético de coords). Para escala
    // continental basta — no necesitamos esférico.
    const cLat =
      tripCoords.reduce((a, [la]) => a + la, 0) / tripCoords.length;
    const cLng =
      tripCoords.reduce((a, [, lo]) => a + lo, 0) / tripCoords.length;
    // Top 5 más cercanos al centroide → tomamos uno random entre ellos
    // para que no sea siempre el mismo cada vez que cargas el dashboard.
    const ranked = [...unclaimed]
      .map((d) => ({
        d,
        dist: Math.hypot(d.lat - cLat, d.lng - cLng),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5)
      .map((x) => x.d);
    return ranked[Math.floor(Math.random() * ranked.length)];
  }
  const suggested = pickSuggested();

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

        {/* Stats command-center. Cuatro métricas mostradas SIEMPRE — los
            ceros también cuentan: comunican "ahí está la meta vacía,
            llénala". Si el user no tiene viajes todavía mostramos un
            hint debajo para que no se sienta como un error de carga. */}
        <section className="grid grid-cols-2 gap-y-5 border-y border-border py-6 sm:gap-y-6 md:grid-cols-4">
          <DashStat
            value={stats.km}
            suffix="km"
            label="Kilómetros"
          />
          <DashStat value={stats.cities} label="Ciudades" />
          <DashStat value={stats.countries} label="Países" />
          <DashStat value={stats.continents} label="Continentes" />
        </section>

        {/* Próximo destino BØLG sugerido. Es el gancho para volver: una
            ciudad de los 100 destinos curados, no conquistada todavía
            y cercana al centroide de su mapa actual. */}
        {suggested && (
          <section className="flex flex-col gap-3">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              <Sparkles className="h-3 w-3" aria-hidden />
              Tu próximo destino BØLG
            </span>
            <Link
              href="/trip/new"
              className="group relative flex flex-col gap-3 overflow-hidden border border-border bg-card p-5 transition-all duration-200 hover:border-aurora/70 hover:shadow-[0_0_0_1px_rgba(91,192,190,0.25)] sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-6"
            >
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-aurora">
                  {suggested.country}
                  <span className="px-2 text-foreground/30">·</span>
                  <span className="text-foreground/55">
                    {suggested.category}
                  </span>
                </span>
                <h2 className="break-words font-display text-2xl font-black leading-[1.05] tracking-tight sm:text-3xl md:text-4xl">
                  {suggested.name}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-foreground/65 sm:text-base">
                  {suggested.hook}
                </p>
              </div>
              <span className="flex items-center gap-2 self-start text-[10px] uppercase tracking-[0.28em] text-foreground/60 transition-colors group-hover:text-aurora sm:self-end">
                <Compass className="h-3 w-3" aria-hidden />
                Conquistar
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </section>
        )}

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
            <div className="flex flex-col gap-5 border border-dashed border-border bg-card/40 p-6 sm:p-8">
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-aurora">
                  <MapPin className="h-3 w-3" aria-hidden />
                  Tu primer viaje
                </span>
                <h3 className="break-words font-display text-2xl font-black leading-[1.1] tracking-tight sm:text-3xl">
                  El Atlas empieza con un paso.
                </h3>
                <p className="max-w-lg text-sm leading-relaxed text-foreground/65 sm:text-base">
                  Pucón, el Cajón del Maipo, una caminata por La Reina —
                  cualquier salida cuenta. Marca el origen, el destino y una
                  foto. Eso solo ya cambia tu mapa.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/trip/new"
                  className="group inline-flex items-center gap-2 border-2 border-foreground bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background transition-colors hover:bg-foreground/90"
                >
                  <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                  Subir mi primer viaje
                </Link>
                <Link
                  href="/explorar"
                  className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
                >
                  Ver lo que sube la comunidad →
                </Link>
              </div>
            </div>
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

function DashStat({
  value,
  label,
  suffix,
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
        <span className="font-mono text-2xl font-bold tabular-nums tracking-tight sm:text-3xl md:text-4xl">
          {value.toLocaleString("es-CL")}
        </span>
        {suffix && (
          <span className="font-mono text-xs text-foreground/40">{suffix}</span>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
        {label}
      </span>
    </div>
  );
}
