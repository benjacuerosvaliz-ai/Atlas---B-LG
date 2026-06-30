"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BolgWordmark } from "@/components/bolg-wordmark";

/**
 * Footer global del sitio — visible en todas las rutas excepto la home
 * (`/`) y `/atlas`, que ya tienen su propio footer minimal dentro de
 * `AtlasClient`. La condición vive acá (client component con
 * `usePathname`) para que el RootLayout pueda seguir siendo server-side
 * sin meter middleware ni headers.
 *
 * Estructura: 3 columnas (stacked en mobile) — marca, mapa interno,
 * marca externa/legal — y una línea final con copyright + IG handle.
 *
 * NOTA legal: `/terminos` ya existe (cubre Términos, Privacidad y
 * Cookies en una sola página por ahora). Los tres links apuntan ahí
 * hasta que se separen en páginas dedicadas.
 */
export function Footer() {
  const pathname = usePathname();

  // Rutas que ya tienen su propio footer dentro del page. No duplicamos.
  if (pathname === "/" || pathname === "/atlas") {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-border bg-ink px-6 py-16 text-white/70 md:px-10 md:py-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <BolgWordmark href="/" />
            <p className="max-w-xs text-sm leading-relaxed text-white/55">
              El Atlas BØLG. Cada viaje cuenta.
            </p>
          </div>

          {/* Mapa interno */}
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
              Mapa
            </span>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-white/75 transition-colors hover:text-white"
                >
                  Atlas
                </Link>
              </li>
              <li>
                <Link
                  href="/ranking"
                  className="text-white/75 transition-colors hover:text-white"
                >
                  Ranking
                </Link>
              </li>
              <li>
                <Link
                  href="/premio"
                  className="text-white/75 transition-colors hover:text-white"
                >
                  Premio mensual
                </Link>
              </li>
              <li>
                <Link
                  href="/premio"
                  className="text-white/75 transition-colors hover:text-white"
                >
                  BØLG-100 destinos
                </Link>
              </li>
            </ul>
          </div>

          {/* Marca / legal */}
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
              Marca
            </span>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <Link
                  href="/terminos"
                  className="text-white/75 transition-colors hover:text-white"
                >
                  Términos
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-white/75 transition-colors hover:text-white"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-white/75 transition-colors hover:text-white"
                >
                  Cookies
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hola@bolg.cl"
                  className="text-white/75 transition-colors hover:text-white"
                >
                  Contacto
                </a>
              </li>
              <li>
                <a
                  href="https://www.bolg.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/75 transition-colors hover:text-white"
                >
                  bolg.cl ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea final */}
        <div className="flex flex-col items-start gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
            © {new Date().getFullYear()} KHUMBU SPA · Hecho en Chile
          </span>
          <a
            href="https://instagram.com/bolgconcept"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 transition-colors hover:text-white"
          >
            @bolgconcept en Instagram ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
