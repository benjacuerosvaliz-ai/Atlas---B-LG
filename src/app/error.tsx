"use client";

import { useEffect } from "react";
import { BolgWordmark } from "@/components/bolg-wordmark";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the client console so the user can grab the digest
    // if they ping us about it.
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-md flex-col gap-6 border border-border bg-card/90 p-6 backdrop-blur-sm md:p-8">
          <span className="text-[10px] uppercase tracking-[0.36em] text-aurora">
            Error
          </span>
          <h1 className="font-display text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
            Algo se desconfiguró.
          </h1>
          <p className="text-sm leading-relaxed text-foreground/65">
            No es tu culpa, fue el Atlas. Reintenta y, si vuelve a fallar,
            cuéntanos por Instagram.
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              Ref: {error.digest}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="flex flex-1 items-center justify-center gap-2 bg-foreground px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-background transition-colors hover:bg-foreground/80"
            >
              Reintentar
            </button>
            <a
              href="/"
              className="flex items-center justify-center px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-foreground/55 transition-colors hover:text-foreground"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
