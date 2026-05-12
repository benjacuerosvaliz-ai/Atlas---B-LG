import Link from "next/link";
import { BolgWordmark } from "@/components/bolg-wordmark";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              404 · Página perdida
            </span>
            <h1 className="font-display text-5xl font-black leading-[1.04] tracking-tight md:text-6xl">
              No encontramos eso.
            </h1>
            <p className="text-base leading-relaxed text-foreground/65">
              El enlace al que llegaste no apunta a nada — puede que el viaje
              que buscabas se haya borrado, que el usuario ya no exista, o que
              alguien te pasó una URL torcida.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors sm:justify-start"
            >
              Volver al inicio →
            </Link>
            <Link
              href="/atlas"
              className="flex items-center justify-center gap-2 px-1 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/70 hover:text-foreground transition-colors sm:justify-start"
            >
              Ver Atlas global →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
