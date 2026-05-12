"use client";

import { ArrowRight, Check, ImageOff, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import { completeOnboarding, type OnboardingState } from "./actions";

export type ModelLite = {
  id: string;
  name: string;
  category: string | null;
  heroImageUrl: string | null;
};

const INITIAL_STATE: OnboardingState = { status: "idle" };

type Props = {
  initialDisplayName: string;
  catalog: ModelLite[];
};

export function OnboardingForm({ initialDisplayName, catalog }: Props) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    INITIAL_STATE,
  );

  function toggleModel(id: string) {
    setSelectedModels((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <input
        type="hidden"
        name="selected_models"
        value={selectedModels.join(",")}
      />

      <section className="flex flex-col gap-6 border-t border-border pt-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          Tu identidad
        </span>

        <Field label="Nombre" hint="Tu nombre como quieres aparecer." required>
          <input
            name="display_name"
            type="text"
            required
            minLength={1}
            maxLength={80}
            defaultValue={initialDisplayName}
            autoComplete="name"
            placeholder="Benja Cueros Valiz"
            className={inputCls}
          />
        </Field>

        <Field
          label="Nombre de usuario"
          hint="Sin espacios. Solo minúsculas, números y guión bajo."
          required
        >
          <input
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={30}
            pattern="^[a-z0-9_]+$"
            autoComplete="username"
            placeholder="benja"
            autoFocus
            className={inputCls}
          />
        </Field>

        <Field label="Ciudad" hint="Opcional. Para ubicarte en el mapa.">
          <input
            name="city"
            type="text"
            maxLength={80}
            autoComplete="address-level2"
            placeholder="Santiago"
            className={inputCls}
          />
        </Field>

        <Field
          label="Instagram"
          hint="Opcional. Tu nombre de Instagram, sin el @."
        >
          <input
            name="instagram_handle"
            type="text"
            maxLength={30}
            placeholder="bolgconcept"
            className={inputCls}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-5 border-t border-border pt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
            Tus BØLG · opcional
          </span>
          {selectedModels.length > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
              {selectedModels.length} marcados
            </span>
          )}
        </div>
        <p className="max-w-lg text-sm leading-relaxed text-foreground/55">
          Marca los que ya tienes para empezar tu equipaje. Puedes agregar
          más después.
        </p>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {catalog.map((m) => {
            const selected = selectedModels.includes(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => toggleModel(m.id)}
                  className={cn(
                    "group flex w-full flex-col gap-1.5 overflow-hidden border transition-colors",
                    selected
                      ? "border-foreground"
                      : "border-border hover:border-foreground/60",
                  )}
                >
                  <div className="relative aspect-square bg-fog">
                    {m.heroImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.heroImageUrl}
                        alt={m.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-foreground/30">
                        <ImageOff className="h-5 w-5" />
                      </div>
                    )}
                    {selected && (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center bg-foreground text-background">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <span className="px-2 pb-2 text-left text-[11px] leading-tight">
                    {m.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {state.status === "error" && (
        <p className="font-mono text-xs text-destructive">{state.message}</p>
      )}

      <div className="flex justify-end border-t border-border pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors disabled:opacity-30"
        >
          {isPending ? (
            <>
              Guardando
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="h-3 w-3" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full border-b border-border bg-transparent py-3 text-base placeholder:text-foreground/30 focus:border-foreground focus:outline-none transition-colors";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
        {hint}
      </p>
    </div>
  );
}
