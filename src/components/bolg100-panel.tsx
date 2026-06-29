"use client";

import { ArrowRight, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { Bolg100Pin } from "@/components/world-map";
import { cn } from "@/lib/utils";

/**
 * Panel/modal para un destino BØLG-100 sin conquistar.
 *
 * Se abre cuando el usuario hace tap en un ghost pin (estrella ember
 * dashed) del mapa. Mismo patrón visual que CountryPanel/CityPanel en
 * AtlasClient: card flotante absoluta, top-[180px] en mobile, right-6
 * en desktop, cerrable con X o con un click fuera (overlay).
 *
 * Estado:
 *   - Si no hay sesión → CTA "Crear cuenta y conquistarlo" a /login.
 *   - Si hay sesión → CTA "Cargar viaje a [destino]" a /trip/new con
 *     suggestion=<name> para prellenar el autocompletado de ciudad.
 *
 * Si el destino ya está "touched" no debería abrirse este panel — el
 * mapa filtra los ghost pins por `!touched`. Aun así, lo permitimos:
 * mostramos un badge "Ya conquistado" y escondemos el CTA destructivo.
 */

const CATEGORY_LABEL: Record<string, string> = {
  iconic: "Icónico",
  hidden: "Escondido",
  natural: "Natural",
  cultural: "Cultural",
  extreme: "Extremo",
};

type Props = {
  destination: Bolg100Pin | null;
  onClose: () => void;
  authedUsername: string | null;
};

function flagFromCountryCode(code: string): string {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 127397 + c.charCodeAt(0)),
  );
}

export function Bolg100Panel({ destination, onClose, authedUsername }: Props) {
  if (!destination) return null;

  // countryCode y category son opcionales en Bolg100Pin pero el loader
  // siempre los provee (Bolg100Status extiende Bolg100Destination).
  const flag = destination.countryCode
    ? flagFromCountryCode(destination.countryCode)
    : "";
  const categoryLabel = destination.category
    ? CATEGORY_LABEL[destination.category] ?? null
    : null;

  const tripHref = `/trip/new?suggestion=${encodeURIComponent(destination.name)}`;

  return (
    <>
      {/* Overlay para cerrar con tap afuera. z-30 para quedar bajo el
          card pero sobre el mapa. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar panel"
        className="fixed inset-0 z-30 cursor-default bg-transparent"
        tabIndex={-1}
      />

      <div
        className={cn(
          "absolute z-40 flex flex-col gap-0 border border-border bg-card/95 backdrop-blur-md",
          "md:right-6 md:top-[180px] md:bottom-[280px] md:w-[360px] md:max-w-[40vw]",
          "inset-x-3 top-[180px] bottom-[300px] md:inset-auto",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={`Destino BØLG ${destination.name}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-foreground/55">
              {flag && <span className="text-base leading-none">{flag}</span>}
              {destination.country}
            </span>
            <h2 className="font-display text-2xl font-black leading-tight tracking-tight">
              {destination.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex w-fit items-center gap-1.5 border border-ember/60 px-2 py-1 text-[10px] uppercase tracking-[0.28em] text-ember">
                <Sparkles className="h-3 w-3" />
                Destino BØLG-100
              </span>
              {categoryLabel && (
                <span className="inline-flex w-fit items-center gap-1.5 border border-border px-2 py-1 text-[10px] uppercase tracking-[0.28em] text-foreground/65">
                  {categoryLabel}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/50 transition-colors hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/55">
            Lo que dice BØLG de este lugar
          </p>
          <p className="font-display text-lg font-black leading-snug tracking-tight">
            {destination.hook}
          </p>

          <div className="mt-2 border-t border-border/60 pt-4">
            {destination.touched ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-aurora">
                  ✓ Ya tocado por la comunidad
                </p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-foreground/65">
                  Alguien ya pisó este destino. Tócalo en el mapa como pin aurora
                  para ver quién lo conquistó.
                </p>
              </>
            ) : (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ember">
                  Sin conquistar
                </p>
                <p className="mt-2 font-display text-base font-black leading-snug tracking-tight">
                  Sé el primer conquistador BØLG aquí.
                </p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-foreground/65">
                  Si subes un viaje a {destination.name} con tu BØLG visible,
                  este destino queda marcado con tu nombre en el Atlas.
                </p>
              </>
            )}
          </div>
        </div>

        {!destination.touched && (
          <Link
            href={authedUsername ? tripHref : "/login"}
            className="group flex items-center justify-center gap-2 border-t border-border bg-foreground px-4 py-3 text-center text-[10px] uppercase tracking-[0.32em] text-background transition-colors hover:bg-foreground/85"
          >
            {authedUsername
              ? `Cargar viaje a ${destination.name}`
              : "Crear cuenta y conquistarlo"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </>
  );
}
