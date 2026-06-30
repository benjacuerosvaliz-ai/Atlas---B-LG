"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Banner de consentimiento de cookies — minimal y BØLG-honest.
 *
 * Solo aparece si `localStorage.bolg_cookie_consent` está vacío. Una vez
 * que el usuario elige, persistimos su decisión ("all" | "essential") y
 * no volvemos a molestarlo. No bloqueamos la UI: es un toast inferior
 * con la copy clara de que no vendemos data a terceros.
 *
 * Nota legal: como solo usamos cookies de sesión + analytics propia
 * (sin terceros pixel-trackers), técnicamente bajo CCPA/GDPR esto va más
 * por transparencia que por obligación. Mantenemos el toggle de "Solo
 * esenciales" listo para cuando metamos algún tercero.
 */

const STORAGE_KEY = "bolg_cookie_consent";

type Consent = "all" | "essential";

export function CookieBanner() {
  // null = aún no decidido por el usuario / aún chequeando localStorage.
  // false = ya decidió (no renderizar). true = mostrar banner.
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (existing === null) setVisible(true);
    } catch {
      // Si localStorage no está disponible (modo privado strict,
      // iframe sandboxed, etc.) no mostramos el banner — no queremos
      // hostigar a la persona en cada navegación sin poder persistir.
    }
  }, []);

  function persist(choice: Consent) {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Mismo razonamiento — si no podemos persistir, al menos cerramos
      // el banner para no romper la experiencia.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Consentimiento de cookies"
      className={cn(
        "fixed inset-x-3 bottom-3 z-[1100] mx-auto flex max-w-2xl flex-col gap-3 border border-border bg-card/95 p-4 backdrop-blur-md shadow-lg",
        "sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:p-5",
      )}
      style={{
        bottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <p className="font-mono text-[11px] leading-relaxed text-foreground/75 sm:text-xs">
        Usamos cookies para mantener tu sesión y entender qué partes del
        Atlas funcionan. Sin terceros vendiendo data.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => persist("essential")}
          className="border border-foreground/40 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/75 transition-colors hover:border-foreground hover:text-foreground"
        >
          Solo esenciales
        </button>
        <button
          type="button"
          onClick={() => persist("all")}
          className="bg-foreground px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-background transition-colors hover:bg-foreground/85"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
