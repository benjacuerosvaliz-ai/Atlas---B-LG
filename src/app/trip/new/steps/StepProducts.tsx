"use client";

import { Check, Package } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OwnedProduct, TripFormData } from "../types";

type Props = {
  data: TripFormData;
  patch: (partial: Partial<TripFormData>) => void;
  products: OwnedProduct[];
};

export function StepProducts({ data, patch, products }: Props) {
  function toggle(id: string) {
    const isOn = data.productIds.includes(id);
    patch({
      productIds: isOn
        ? data.productIds.filter((x) => x !== id)
        : [...data.productIds, id],
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
          Tus BØLG en este viaje
        </span>
        <h2 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
          ¿Qué te llevaste?
        </h2>
        <p className="max-w-md text-base leading-relaxed text-foreground/60">
          Tageá los BØLG que viajaron contigo — los kilómetros suman a cada
          uno y aparecen en su historial.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col gap-4 border border-dashed border-border p-8">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-foreground/50" aria-hidden />
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/60">
              Aún no tenés productos vinculados
            </span>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-foreground/55">
            Cuando escanees el QR de un BØLG físico, aparece acá para que
            puedas asociarlo a tus viajes. Por ahora, salteá este paso —
            podés volver y tageelos después.
          </p>
          <Link
            href="/dashboard"
            className="self-start text-[10px] uppercase tracking-[0.28em] text-foreground/70 underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Vincular un BØLG (próximamente)
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => {
            const selected = data.productIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={cn(
                  "flex items-center justify-between border px-4 py-4 transition-colors",
                  selected
                    ? "border-foreground bg-foreground/[0.04]"
                    : "border-border hover:border-foreground/60",
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="text-base">{p.givenName ?? p.modelName}</span>
                  {p.givenName && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/45">
                      {p.modelName}
                    </span>
                  )}
                </div>
                {selected && <Check className="h-4 w-4" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
