"use client";

import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

/**
 * Tour estilo MercadoLibre/Strava para usuarios anónimos en /.
 *
 * Recorre 4 puntos clave del Atlas (scroll-based, sin el panel HUD viejo):
 *   1. KPI banner — lo que la comunidad ya conquistó
 *   2. Mapa — cómo se lee (ember = destino, aurora = conquistador)
 *   3. Top conquistadores — el ranking que puedes pasar
 *   4. CTA hazte parte — tu turno
 *
 * Trigger: solo manual con el botón "?". No auto-fire (el hero card
 * de bienvenida ya cubre la primera visita).
 */

const STORAGE_KEY = "bolg_tour_seen_v1";

type Props = {
  authedUsername: string | null;
};

export function OnboardingTour({ authedUsername }: Props) {
  const driverRef = useRef<Driver | null>(null);

  const startTour = useCallback(() => {
    if (!driverRef.current) {
      driverRef.current = driver({
        showProgress: true,
        showButtons: ["next", "previous", "close"],
        nextBtnText: "Siguiente →",
        prevBtnText: "← Atrás",
        doneBtnText: "Crear cuenta gratis →",
        progressText: "{{current}} / {{total}}",
        smoothScroll: true,
        animate: true,
        overlayColor: "rgba(15, 15, 14, 0.85)",
        stagePadding: 6,
        stageRadius: 0,
        popoverClass: "bolg-tour-popover",
        steps: [
          {
            element: '[data-tour="kpis"]',
            popover: {
              title: "Lo que ya conquistó la comunidad.",
              description:
                "Kilómetros, ciudades, países y continentes que clientes BØLG ya pisaron. Tus viajes suman a este contador.",
              side: "bottom",
              align: "center",
            },
          },
          {
            element: '[data-tour="map"]',
            popover: {
              title: "Así se lee el mapa.",
              description:
                "Cada estrella ember es un destino BØLG sin conquistar. Cada punto aurora es alguien que ya conquistó esa ciudad. Tócalos para ver el detalle.",
              side: "bottom",
              align: "center",
            },
          },
          {
            element: '[data-tour="top"]',
            popover: {
              title: "Top conquistadores.",
              description:
                "Si subes más viajes que ellos, los pasas. El #1 del mes se lleva premio.",
              side: "top",
              align: "center",
            },
          },
          {
            element: '[data-tour="join"]',
            popover: {
              title: "Tu turno.",
              description:
                "Crea tu cuenta en 30 segundos, sube tu primer viaje y empieza a marcar territorio.",
              side: "top",
              align: "center",
            },
          },
        ],
        onDestroyStarted: () => {
          // Marcamos como visto al cerrar (X, esc o finish).
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            // SSR / private mode — ignore.
          }
          driverRef.current?.destroy();
        },
        onCloseClick: () => {
          driverRef.current?.destroy();
        },
        // Botón final ("Done") va a /login. driver.js no expone un handler
        // específico — lo metemos vía override de onNextClick en el último
        // paso.
        onNextClick: (_el, _step, opts) => {
          if (!driverRef.current) return;
          if (opts.state.activeIndex === (opts.config.steps?.length ?? 0) - 1) {
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            window.location.href = "/login";
            return;
          }
          driverRef.current.moveNext();
        },
      });
    }
    driverRef.current.drive();
  }, []);

  // Sin auto-fire. El hero card hace el trabajo de bienvenida; este tour
  // queda detrás del botón "?" para quien quiera repasar.
  useEffect(() => {
    // void to satisfy lint without changing behavior
    void authedUsername;
    void startTour;
  }, [authedUsername, startTour]);

  // Botón "?" siempre disponible para reabrir el tour.
  if (authedUsername) return null;

  return (
    <button
      type="button"
      onClick={startTour}
      aria-label="Ver el tutorial otra vez"
      className="absolute bottom-[440px] left-4 z-30 flex h-10 w-10 items-center justify-center border border-border bg-card/90 text-foreground/70 backdrop-blur-sm transition-colors hover:border-foreground hover:text-foreground sm:bottom-[160px] md:left-6"
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}
