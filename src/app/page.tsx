import { ArrowRight, MapPin, Mountain, Package } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { KpiStrip } from "@/components/KpiStrip";
import { Navbar } from "@/components/Navbar";
import { Globe } from "@/components/globe/Globe";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  // Live community KPIs from public trips + registered users. Falls back
  // to 0 cleanly when the DB is empty — the CTA at the bottom converts
  // visitors into the first row.
  const supabase = await createClient();
  const [{ data: tripsAgg }, { count: usersCount }] = await Promise.all([
    supabase
      .from("trips")
      .select("distance_km, country_codes")
      .eq("visibility", "public"),
    supabase.from("users").select("*", { count: "exact", head: true }),
  ]);

  const rows = tripsAgg ?? [];
  const totalKm = Math.round(
    rows.reduce((acc, t) => acc + ((t.distance_km as number | null) ?? 0), 0),
  );
  const totalTrips = rows.length;
  const countries = new Set<string>();
  for (const t of rows) {
    for (const c of (t.country_codes as string[] | null) ?? []) {
      if (c) countries.add(c);
    }
  }
  const totalUsers = usersCount ?? 0;

  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />

      <main className="relative flex flex-col gap-24 px-6 pb-24 pt-28 md:px-10 lg:pt-32">
        {/* Hero */}
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <Globe cameraDistance={5} height="min(55vh, 460px)" />
          </div>

          <div className="order-1 flex flex-col gap-10 lg:order-2 lg:pl-4">
            <div className="flex flex-col gap-5">
              <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
                BØLG Atlas
              </span>
              <h1 className="font-display text-4xl font-black leading-[1.04] tracking-tight md:text-5xl lg:text-[3.75rem]">
                Cada cliente, cada kilómetro, cada país.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-foreground/65 md:text-lg">
                Los clientes BØLG recorren el mundo y lo van pintando acá. Mira
                en vivo dónde están, cuántos kilómetros llevan acumulados y qué
                países han pisado.
              </p>
            </div>

            <KpiStrip
              totalKm={totalKm}
              totalTrips={totalTrips}
              totalCountries={countries.size}
              totalUsers={totalUsers}
            />
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Cómo funciona
            </span>
            <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
              Tres pasos a tu propio Atlas.
            </h2>
          </div>

          <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
            <Step
              n={1}
              icon={MapPin}
              title="Crea tu cuenta"
              body="Sin contraseñas — un correo, un enlace mágico, listo. 30 segundos."
            />
            <Step
              n={2}
              icon={Mountain}
              title="Sube tu primer viaje"
              body="Lugar, fechas, fotos, los BØLG que llevaste. Calculamos los kilómetros automático."
            />
            <Step
              n={3}
              icon={Package}
              title="Tu perfil crece"
              body="Tus km, países y gear se acumulan en tu bitácora de toda la vida. La comunidad gana medallas, reconocimientos y premios mensuales por kilómetros recorridos."
            />
          </ol>

          {/* CTAs inline, justo después del paso a paso */}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-foreground px-6 py-4 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors sm:justify-start"
            >
              Crear cuenta
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
            <Link
              href="/atlas"
              className="flex items-center justify-center gap-2 px-1 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/70 hover:text-foreground transition-colors sm:justify-start"
            >
              Ver Atlas global →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 md:px-10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/45">
            BØLG Atlas · {new Date().getFullYear()}
          </span>
          <div className="flex gap-6">
            <Link
              href="/atlas"
              className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
            >
              Atlas global
            </Link>
            <Link
              href="/login"
              className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
            >
              Ingresar
            </Link>
            <a
              href="https://www.bolg.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
            >
              bolg.cl ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: number;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <li className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.28em] text-foreground/40">
          {String(n).padStart(2, "0")}
        </span>
        <Icon className="h-4 w-4 text-foreground/60" aria-hidden />
      </div>
      <h3 className="font-display text-2xl font-black leading-tight tracking-tight">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-foreground/65">{body}</p>
    </li>
  );
}
