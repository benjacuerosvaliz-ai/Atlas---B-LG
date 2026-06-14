"use client";

import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

/**
 * Tour estilo MercadoLibre/Strava para usuarios anónimos en /.
 *
 * Recorre 6 elementos clave del Atlas resaltando con spotlight:
 *   1. Mapa con países conquistados
 *   2. KPIs (lo que vas a sumar tú)
 *   3. Top 3 viajeros (a quién quieres pasar)
 *   4. Chips de país (drill-down)
 *   5. Botón "Cargar viaje" o link "Hazte parte"
 *   6. CTA final → /login
 *
 * Trigger: usuario anónimo, primera visita (localStorage). Se puede
 * reabrir con el botón "?" abajo a la izquierda en cualquier momento.
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
            element: '[data-tour="map"]',
            popover: {
              title: "Este es el Atlas BØLG.",
              description:
                "Cada ciudad del mundo puede ser conquistada por un viajero BØLG. Los países que ves coloreados son los que ya tienen al menos una persona que los recorrió con su BØLG.",
            },
          },
          {
            element: '[data-tour="kpis"]',
            popover: {
              title: "Los números de la comunidad.",
              description:
                "Acá están los kilómetros recorridos, ciudades visitadas, países y continentes que ya pisaron clientes BØLG. ¿Te imaginas sumar los tuyos?",
              side: "bottom",
              align: "center",
            },
          },
          {
            element: '[data-tour="top"]',
            popover: {
              title: "Los top viajeros.",
              description:
                "Los 3 con más kilómetros recorridos. Cuando subas tus viajes, vas a ir trepando este ranking. Hay premios mensuales para el #1.",
              side: "bottom",
              align: "end",
            },
          },
          {
            element: '[data-tour="hud"]',
            popover: {
              title: "Explora país por país.",
              description:
                "Toca cualquier país para ver quién ha estado ahí. Cuando subas tu primer viaje, ese país se pinta — y si eres el primero con producto BØLG, te conviertes en su conquistador.",
              side: "top",
              align: "center",
            },
          },
          {
            element: '[data-tour="join"]',
            popover: {
              title: "Tu turno.",
              description:
                "Crear tu cuenta toma 30 segundos y es gratis. Sube tu primer viaje, marca tu territorio en el mapa, y empieza tu propio Atlas.",
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
      className="absolute bottom-[140px] left-4 z-30 flex h-10 w-10 items-center justify-center border border-border bg-card/90 text-foreground/70 backdrop-blur-sm transition-colors hover:border-foreground hover:text-foreground md:bottom-[160px] md:left-6"
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}
