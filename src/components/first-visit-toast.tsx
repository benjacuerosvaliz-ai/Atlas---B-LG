"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Toast sutil de "primera vez" — explica el gesto básico (tocar una
 * estrella ember) a usuarios anónimos que llegan por primera vez al Atlas.
 *
 * Reglas:
 *  - Solo si NO hay sesión (caller pasa `authedUsername: null`).
 *  - Solo si nunca se vio (localStorage.bolg_first_visit ausente).
 *  - Aparece 5s después de montar — da tiempo a que carguen kpis + mapa.
 *  - Auto-dismiss a los 8s tras aparecer. Tap también lo cierra.
 *  - El caller decide si renderizar (e.g. evitarlo en WebViews).
 */

const STORAGE_KEY = "bolg_first_visit";

export type FirstVisitToastProps = {
  /** Si hay sesión, no se muestra nunca. */
  authedUsername: string | null;
};

export function FirstVisitToast({ authedUsername }: FirstVisitToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (authedUsername) return; // logged in → skip
    let seen = false;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      // Sin localStorage no podemos garantizar "solo primera vez", así
      // que mejor no mostrar para no spamear.
      return;
    }
    if (seen) return;

    const showTimer = window.setTimeout(() => setVisible(true), 5000);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }, 5000 + 8000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [authedUsername]);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={dismiss}
      aria-label="Cerrar mensaje de bienvenida"
      className={cn(
        "fixed bottom-4 left-3 z-[60] max-w-[260px] border border-foreground/30 bg-card/90 px-3 py-2.5 text-left font-mono text-[10px] leading-snug text-foreground/80 shadow-lg backdrop-blur-md transition-opacity",
        "sm:left-4 sm:max-w-[300px]",
      )}
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <span className="block uppercase tracking-[0.28em] text-aurora">
        Bienvenido
      </span>
      <span className="mt-1 block normal-case tracking-normal text-foreground/85">
        Toca cualquier estrella ember en el mapa para conocer un destino BØLG.
      </span>
    </button>
  );
}
