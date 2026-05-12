"use client";

import { Check, ExternalLink, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductModelLite, TripFormData } from "../types";

type Props = {
  data: TripFormData;
  patch: (partial: Partial<TripFormData>) => void;
  catalog: ProductModelLite[];
};

export function StepProducts({ data, patch, catalog }: Props) {
  const hasPhotos = data.photos.length > 0;

  function toggle(id: string) {
    if (!hasPhotos) return;
    const isOn = data.claimedModelIds.includes(id);
    patch({
      claimedModelIds: isOn
        ? data.claimedModelIds.filter((x) => x !== id)
        : [...data.claimedModelIds, id],
    });
  }

  // alreadyOwned first, then everyone else. Within each group, alphabetical
  // (catalog is already ordered by name from the server query).
  const sorted = [...catalog].sort((a, b) => {
    if (a.alreadyOwned !== b.alreadyOwned) return a.alreadyOwned ? -1 : 1;
    return 0;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
          Tus BØLG en este viaje
        </span>
        <h2 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
          ¿Qué te llevaste?
        </h2>
        <p className="max-w-lg text-base leading-relaxed text-foreground/60">
          Tageá los que estuvieron contigo — sus kilómetros suman a tu gear y
          quedan registrados en su historial. Lo que no tenés, podés mandarte
          a la tienda directo.
        </p>
      </div>

      {!hasPhotos && (
        <div className="flex flex-col gap-2 border border-destructive/40 bg-destructive/[0.04] px-4 py-3">
          <span className="text-[10px] uppercase tracking-[0.28em] text-destructive">
            Necesitás al menos 1 foto del viaje
          </span>
          <p className="font-mono text-xs leading-relaxed text-foreground/65">
            Para sumar productos pedimos foto-evidencia. Volvé al paso anterior
            y subí una. Sin ella podés saltar este paso, pero los tags quedan
            sin efecto.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sorted.map((m) => {
          const selected = data.claimedModelIds.includes(m.id);
          return (
            <article
              key={m.id}
              className={cn(
                "flex flex-col overflow-hidden border transition-colors",
                selected
                  ? "border-foreground"
                  : "border-border",
              )}
            >
              <div className="relative aspect-square bg-fog">
                {m.heroImageUrl ? (
                  // Direct Shopify CDN; <Image /> would need remotePatterns config.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.heroImageUrl}
                    alt={m.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-foreground/30">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
                {m.alreadyOwned && (
                  <span className="absolute left-2 top-2 bg-ink/85 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-bone">
                    En tu gear
                  </span>
                )}
                {selected && (
                  <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center bg-foreground text-background">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm leading-tight">{m.name}</span>
                  {m.category && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/40">
                      {m.category}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    disabled={!hasPhotos}
                    className={cn(
                      "px-2 py-2 text-[10px] uppercase tracking-[0.22em] transition-colors",
                      selected
                        ? "bg-foreground text-background hover:bg-foreground/80"
                        : "border border-border text-foreground hover:border-foreground",
                      !hasPhotos && "opacity-30 cursor-not-allowed hover:border-border",
                    )}
                  >
                    {selected ? "Tageado ✓" : "Viajé con este"}
                  </button>
                  {m.productUrl && !m.alreadyOwned && (
                    <a
                      href={m.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] uppercase tracking-[0.22em] text-foreground/55 hover:text-foreground transition-colors"
                    >
                      Lo quiero
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {catalog.length === 0 && (
        <p className="font-mono text-xs text-foreground/45">
          El catálogo aún no se cargó. Recargá la página o avísame.
        </p>
      )}
    </div>
  );
}
