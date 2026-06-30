import Link from "next/link";
import type { Metadata } from "next";
import { BolgWordmark } from "@/components/bolg-wordmark";

export const metadata: Metadata = {
  title: "404 · Esto no está en el Atlas",
  description:
    "El enlace al que llegaste no existe en BØLG Atlas. Vuelve al inicio o explora el ranking.",
};

/**
 * 404 raíz de la app: lo sirve Next tanto cuando un segmento llama
 * `notFound()` como cuando la URL no matchea ninguna ruta. Mantén la
 * misma estructura (header con wordmark + main centrado + footer minimal)
 * que el resto de páginas de marca para que el salto no se sienta a "error
 * técnico" sino a "página de marca".
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="flex w-full max-w-xl flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              404 · Fuera del mapa
            </span>
            <h1 className="font-display text-5xl font-black leading-[1.04] tracking-tight md:text-6xl">
              Esto no está en el Atlas.
            </h1>
            <p className="text-base leading-relaxed text-foreground/65">
              El link al que llegaste no existe — el viaje puede haberse
              borrado, el username puede haber cambiado, o alguien te pasó
              una URL mal.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background transition-colors hover:bg-foreground/80 sm:justify-start"
            >
              Volver al Atlas →
            </Link>
            <Link
              href="/ranking"
              className="flex items-center justify-center gap-2 border border-foreground/15 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground sm:justify-start"
            >
              Ver el ranking →
            </Link>
            <Link
              href="/sobre"
              className="flex items-center justify-center gap-2 px-2 py-3 text-[10px] uppercase tracking-[0.28em] text-foreground/55 transition-colors hover:text-foreground sm:justify-start"
            >
              Sobre el proyecto →
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 md:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/35">
          BØLG · Atlas
        </p>
      </footer>
    </div>
  );
}
