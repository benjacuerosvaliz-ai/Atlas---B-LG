import { ArrowRight, Award, KeyRound, Trophy, Wallet } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "El Premio Mensual — BØLG Atlas",
  description:
    "Cada mes premiamos al #1 del Ranking BØLG: parche edición limitada, $100.000 CLP, portada en RRSS y llavero. Así se gana.",
};

export default function PremioPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />

      <main className="relative flex flex-col gap-24 px-6 pb-24 pt-28 md:px-10 lg:pt-32">
        {/* Hero */}
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              BØLG Atlas · Premio mensual
            </span>
            <h1 className="font-display text-4xl font-black leading-[1.04] tracking-tight md:text-5xl lg:text-[3.75rem]">
              El Premio Mensual BØLG.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-foreground/65 md:text-lg">
              El último día de cada mes coronamos al #1 del Ranking. Conquista
              más continentes, países y ciudades que el resto y te llevas el
              kit completo.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 bg-foreground px-6 py-4 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors sm:justify-start"
              >
                Súmate al ranking
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
              <Link
                href="/ranking"
                className="flex items-center justify-center gap-2 px-1 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/70 hover:text-foreground transition-colors sm:justify-start"
              >
                Ver ranking en vivo →
              </Link>
            </div>
          </div>

          {/* Bloque visual brutal: caja negra con el "kit" listado en
              monoespaciada, sin fotos. Misma lógica visual que /sobre
              cuando no hay globo. */}
          <div className="border border-border bg-foreground p-8 text-background md:p-10">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-background/55">
              Kit del mes
            </span>
            <ul className="mt-6 flex flex-col gap-5 font-mono text-sm">
              <li className="flex items-baseline justify-between gap-4 border-b border-background/15 pb-4">
                <span className="uppercase tracking-[0.18em]">Parche EL</span>
                <span className="text-background/55">edición limitada</span>
              </li>
              <li className="flex items-baseline justify-between gap-4 border-b border-background/15 pb-4">
                <span className="uppercase tracking-[0.18em]">$100.000</span>
                <span className="text-background/55">CLP en efectivo</span>
              </li>
              <li className="flex items-baseline justify-between gap-4 border-b border-background/15 pb-4">
                <span className="uppercase tracking-[0.18em]">Portada</span>
                <span className="text-background/55">RRSS BØLG</span>
              </li>
              <li className="flex items-baseline justify-between gap-4">
                <span className="uppercase tracking-[0.18em]">Llavero</span>
                <span className="text-background/55">conmemorativo</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Qué se gana — desglose explicativo */}
        <section className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Qué se gana
            </span>
            <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
              Cuatro cosas que no se compran en ningún lado.
            </h2>
          </div>

          <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-10">
            <Prize
              n={1}
              icon={Award}
              title="Parche edición limitada"
              body="Diseño nuevo cada mes, solo para el #1. Tirada de un único parche."
            />
            <Prize
              n={2}
              icon={Wallet}
              title="$100.000 CLP"
              body="En efectivo, a tu cuenta. Sin condiciones, sin gastar en BØLG."
            />
            <Prize
              n={3}
              icon={Trophy}
              title="Portada en RRSS"
              body="Tu foto y tu ruta del mes en las redes oficiales BØLG."
            />
            <Prize
              n={4}
              icon={KeyRound}
              title="Llavero conmemorativo"
              body="Metálico, grabado con el mes y tu nombre. Pieza única."
            />
          </ul>
        </section>

        {/* Cómo se gana */}
        <section className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Cómo se gana
            </span>
            <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
              Quedando #1 del Ranking al cierre del mes.
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/65">
              El Ranking se calcula con tus conquistas reales: cada ciudad que
              subes al Atlas con producto BØLG suma. A las 23:59 del último día
              del mes, congelamos el ranking y el #1 se lleva el kit.
            </p>
          </div>
        </section>

        {/* Reglas */}
        <section className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Reglas
            </span>
            <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
              Cómo desempatamos y cómo rotamos.
            </h2>
          </div>

          <ol className="flex flex-col gap-8">
            <Rule
              n={1}
              title="Tiebreaker en cascada"
              body="Si dos o más empatan en el #1, gana quien tenga más continentes conquistados. Si siguen empatados, más países. Después, más ciudades. Y al final, el primero que llegó a su última conquista del mes."
            />
            <Rule
              n={2}
              title="Sin meses consecutivos"
              body="El ganador del mes anterior no puede volver a ganar el mes siguiente. Si quedas #1 dos meses seguidos, el premio pasa al #2. Volves a ser elegible al mes subsiguiente."
            />
            <Rule
              n={3}
              title="Solo viajes verificados"
              body="Las conquistas que cuentan son las que pasaron la validación del Atlas (ciudad real, fecha real, producto reclamado). Si un viaje se elimina o se marca como inválido, baja del ranking automático."
            />
          </ol>
        </section>

        {/* FAQ corto */}
        <section className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              FAQ
            </span>
            <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
              Lo que siempre preguntan.
            </h2>
          </div>

          <dl className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
            <Faq
              q="¿Se acumula?"
              a="No. Cada mes parte de cero. El premio es solo del ganador del mes en curso."
            />
            <Faq
              q="¿Es transferible?"
              a="No. El premio va al titular de la cuenta #1, identificable por correo. No se entrega a terceros."
            />
            <Faq
              q="¿Y si renuncio al premio?"
              a="Pasa al siguiente del podio. Si el #2 también renuncia, baja al #3, y así sucesivamente."
            />
          </dl>
        </section>

        {/* CTA final */}
        <section className="flex flex-col items-start gap-6 border-t border-border pt-12">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Empieza ahora
            </span>
            <h2 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
              El mes ya está corriendo.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-foreground/65">
              Crea tu cuenta, sube tu primer viaje y entra al ranking. Te
              quedan días para ser el #1.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-foreground px-6 py-4 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors sm:justify-start"
            >
              Súmate al ranking
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
            <Link
              href="/sobre"
              className="flex items-center justify-center gap-2 px-1 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/70 hover:text-foreground transition-colors sm:justify-start"
            >
              Cómo funciona el Atlas →
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
              href="/"
              className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
            >
              Atlas global
            </Link>
            <Link
              href="/ranking"
              className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
            >
              Ranking
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

function Prize({
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
      <h3 className="font-display text-xl font-black leading-tight tracking-tight">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-foreground/65">{body}</p>
    </li>
  );
}

function Rule({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:gap-10">
      <div className="flex shrink-0 items-baseline gap-3 md:w-40">
        <span className="font-mono text-xs uppercase tracking-[0.28em] text-foreground/40">
          R/{String(n).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-2xl font-black leading-tight tracking-tight">
          {title}
        </h3>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/65 md:text-base">
          {body}
        </p>
      </div>
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-6">
      <dt className="font-display text-lg font-black leading-tight tracking-tight">
        {q}
      </dt>
      <dd className="text-sm leading-relaxed text-foreground/65">{a}</dd>
    </div>
  );
}
