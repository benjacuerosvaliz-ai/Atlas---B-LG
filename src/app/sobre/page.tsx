import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Map as MapIcon,
  MapPin,
  Mountain,
  Package,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { KpiStrip } from "@/components/KpiStrip";
import { Navbar } from "@/components/Navbar";
import { Globe } from "@/components/globe/Globe";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sobre el Atlas",
  description:
    "Qué es el Atlas BØLG, cómo funciona y por qué cada viaje cuenta. La bitácora viva de la comunidad BØLG.",
};

export default async function SobrePage() {
  // Live community KPIs from public trips + registered users. Same numbers
  // the immersive landing surfaces, but presented next to the explainer
  // so first-timers see the platform isn't empty.
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

      <main className="relative flex flex-col gap-32 px-6 pb-32 pt-28 md:px-10 lg:pt-32">
        {/* Hero */}
        <section className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Glow sutil detrás del título */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 left-0 hidden h-[420px] w-[420px] rounded-full bg-aurora/10 blur-[120px] lg:block"
          />

          <div className="order-2 lg:order-1">
            <Globe cameraDistance={5} height="min(55vh, 460px)" />
          </div>

          <div className="relative order-1 flex flex-col gap-10 lg:order-2 lg:pl-4">
            <div className="flex flex-col gap-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground/40">
                Sobre el Atlas
              </span>
              <h1 className="font-display text-4xl font-black leading-[1.02] tracking-tight md:text-5xl lg:text-[3.75rem]">
                Las olas no se quedan{" "}
                <span className="italic text-aurora">quietas.</span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-foreground/65 md:text-lg">
                Tu BØLG es una bitácora viva. El Atlas es donde esa bitácora se
                cuenta al mundo — kilómetros, países, ciudades, dueños
                sucesivos. Todo en un mismo mapa.
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

        {/* Qué es */}
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Qué es
            </span>
            <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
              Un mapa que tu BØLG va escribiendo sola.
            </h2>
          </div>

          <div className="flex flex-col gap-6 text-base leading-relaxed text-foreground/75 md:text-lg">
            <p>
              Cada BØLG vendida es una historia que recién empieza. Pasa de
              manos, cruza fronteras, suma medallas. El Atlas convierte esos
              viajes en un mapa colectivo donde podemos verlos a todos a la
              vez.
            </p>
            <p>
              <span className="text-foreground">No es un feed.</span> No es una
              red social. Es una bitácora honesta: cuántos kilómetros lleva
              encima tu equipaje, qué países pisaste con él, quién lo tuvo
              antes que tú.
            </p>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground/40">
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
              body="Sin contraseñas — un correo, un enlace de acceso, listo. 30 segundos y estás dentro."
            />
            <Step
              n={2}
              icon={Mountain}
              title="Sube tus viajes"
              body="Lugar, fechas, foto, los BØLG que llevaste. Calculamos los kilómetros automático y los sumamos al globo."
            />
            <Step
              n={3}
              icon={Package}
              title="Conquista"
              body="Tus km, países y equipaje se acumulan en una bitácora de toda la vida. La comunidad gana medallas, reconocimientos y el premio mensual del ranking."
            />
          </ol>
        </section>

        {/* El premio */}
        <section className="relative overflow-hidden border border-border bg-fog/40 p-8 md:p-12 lg:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-[320px] w-[320px] rounded-full bg-ember/10 blur-[100px]"
          />
          <div className="relative grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div className="flex flex-col gap-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-ember/80">
                El premio
              </span>
              <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
                El último día de cada mes coronamos al #1.
              </h2>
              <p className="max-w-md text-base leading-relaxed text-foreground/65">
                Quien más continentes, países y ciudades conquistó en el mes se
                lleva el kit completo: parche edición limitada, $100.000 CLP,
                portada en RRSS y llavero.
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <ul className="grid grid-cols-2 gap-3 text-sm">
                <PrizeBullet icon={Trophy} label="Parche edición limitada" />
                <PrizeBullet icon={Sparkles} label="$100.000 CLP" />
                <PrizeBullet icon={Compass} label="Portada RRSS" />
                <PrizeBullet icon={MapIcon} label="Llavero del mes" />
              </ul>
              <Link
                href="/premio"
                className="group inline-flex items-center gap-2 self-start border border-foreground/20 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-foreground transition-colors hover:bg-foreground hover:text-background lg:self-end"
              >
                Ver cómo se gana
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* La marca */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              La marca
            </span>
            <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
              BØLG es equipaje pensado para moverse.
            </h2>
          </div>

          <div className="flex flex-col gap-6 text-base leading-relaxed text-foreground/75 md:text-lg">
            <p>
              Diseñamos en Chile, fabricamos con materiales pensados para
              durar décadas y vendemos directo, sin intermediarios. El Atlas
              es la prueba pública de eso: lo que dura, viaja; lo que viaja,
              se cuenta.
            </p>
            <a
              href="https://www.bolg.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 self-start text-[10px] uppercase tracking-[0.28em] text-foreground/70 transition-colors hover:text-foreground"
            >
              Conoce los productos en bolg.cl
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </section>

        {/* CTA final */}
        <section className="flex flex-col items-center gap-8 border-t border-border pt-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Tu turno
            </span>
            <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-5xl">
              Pinta tu primer kilómetro en el globo.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-foreground/65">
              30 segundos para crear cuenta. Después, el mapa empieza a contar
              tu historia.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/login"
              className="group flex items-center justify-center gap-2 bg-foreground px-7 py-4 text-[10px] uppercase tracking-[0.28em] text-background transition-colors hover:bg-foreground/85"
            >
              Súmate al Atlas
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 border border-foreground/25 px-7 py-4 text-[10px] uppercase tracking-[0.28em] text-foreground/80 transition-colors hover:border-foreground hover:text-foreground"
            >
              Ver el mapa
            </Link>
          </div>
        </section>
      </main>
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
    <li className="group flex flex-col gap-4 border-t border-border pt-6 transition-colors hover:border-foreground/40">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.28em] text-foreground/40">
          {String(n).padStart(2, "0")}
        </span>
        <Icon
          className="h-4 w-4 text-foreground/60 transition-colors group-hover:text-aurora"
          aria-hidden
        />
      </div>
      <h3 className="font-display text-2xl font-black leading-tight tracking-tight">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-foreground/65">{body}</p>
    </li>
  );
}

function PrizeBullet({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 border border-border bg-background/40 px-3 py-2.5 text-[11px] uppercase tracking-[0.18em] text-foreground/75">
      <Icon className="h-3.5 w-3.5 shrink-0 text-ember/80" aria-hidden />
      {label}
    </li>
  );
}
