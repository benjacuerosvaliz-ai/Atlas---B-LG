"use client";

import { ArrowRight, Check, ImageOff, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { CityPicker } from "@/components/city-picker";
import type { City } from "@/lib/mapbox";
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
  mode: "full" | "pin-only";
  initialDisplayName: string;
  catalog: ModelLite[];
};

export function OnboardingForm({ mode, initialDisplayName, catalog }: Props) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [city, setCity] = useState<City | undefined>(undefined);
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    INITIAL_STATE,
  );

  function toggleModel(id: string) {
    setSelectedModels((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  const pinTooShort = pin.length > 0 && pin.length < 4;
  const pinMismatch =
    pin.length === 4 && pinConfirm.length === 4 && pin !== pinConfirm;

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <input type="hidden" name="mode" value={mode} />
      {mode === "full" && (
        <input
          type="hidden"
          name="selected_models"
          value={selectedModels.join(",")}
        />
      )}

      {mode === "full" && (
        <section className="flex flex-col gap-6 border-t border-border pt-6">
          <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
            Tu identidad
          </span>

          <Field
            label="Nombre"
            hint="Tu nombre completo como quieres aparecer en tu perfil. Espacios, tildes y mayúsculas OK."
            required
          >
            <input
              name="display_name"
              type="text"
              required
              minLength={1}
              maxLength={80}
              defaultValue={initialDisplayName}
              autoComplete="name"
              placeholder="Juan Pérez"
              className={inputCls}
            />
          </Field>

          <Field
            label="Nombre de usuario"
            hint="Es tu @handle — lo que va en tu URL (atlas.bolg.cl/u/tu_handle). Solo minúsculas, números y guión bajo, sin espacios."
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
              placeholder="juanperez"
              autoFocus
              className={inputCls}
            />
          </Field>

          <Field
            label="¿Desde qué ciudad partes?"
            hint="Opcional. Elige una de las sugerencias — no escribas libre."
          >
            <CityPicker
              label=""
              value={city}
              onChange={setCity}
              placeholder="Busca tu ciudad: Santiago, Pucón, Madrid..."
            />
            {/* Hidden input para que el FormData del action server reciba el
                nombre de la ciudad como string. Se mantiene compat con el
                action existente que lee formData.get("city"). */}
            <input type="hidden" name="city" value={city?.name ?? ""} />
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
      )}

      <section className="flex flex-col gap-6 border-t border-border pt-6">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
            Tu PIN de acceso
          </span>
          <p className="max-w-lg text-sm leading-relaxed text-foreground/55">
            4 dígitos. Es tu llave rápida para entrar la próxima vez sin
            esperar el correo. Memorízalo bien — si lo olvidas, vuelves a
            pedir un magic link y lo cambias acá.
          </p>
        </div>

        <Field label="PIN (4 dígitos)" hint="Solo números." required>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            required
            maxLength={4}
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            autoComplete="new-password"
            autoFocus={mode === "pin-only"}
            placeholder="••••"
            className={cn(inputCls, "tracking-[0.5em] text-center font-mono")}
          />
        </Field>

        <Field label="Confirmar PIN" hint="Repítelo." required>
          <input
            name="pin_confirm"
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            required
            maxLength={4}
            value={pinConfirm}
            onChange={(e) =>
              setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            autoComplete="new-password"
            placeholder="••••"
            className={cn(inputCls, "tracking-[0.5em] text-center font-mono")}
          />
        </Field>

        {pinTooShort && (
          <p className="font-mono text-xs text-foreground/55">
            Necesitas 4 dígitos.
          </p>
        )}
        {pinMismatch && (
          <p className="font-mono text-xs text-destructive">
            Los dos PINs no coinciden.
          </p>
        )}
      </section>

      {mode === "full" && (
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
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {catalog.map((m) => {
              const selected = selectedModels.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggleModel(m.id)}
                    className={cn(
                      "group flex min-h-[44px] w-full flex-col gap-1.5 overflow-hidden border transition-colors",
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
                        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center bg-foreground text-background sm:h-6 sm:w-6">
                          <Check className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                        </span>
                      )}
                    </div>
                    <span className="px-2 pb-2 text-left text-[12px] leading-tight sm:text-[11px]">
                      {m.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {state.status === "error" && (
        <p className="font-mono text-xs text-destructive">{state.message}</p>
      )}

      <div className="flex border-t border-border pt-6 sm:justify-end">
        <button
          type="submit"
          disabled={isPending || pinMismatch || pin.length !== 4}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors disabled:opacity-30 sm:w-auto"
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
  "w-full min-h-[44px] border-b border-border bg-transparent py-3 text-base placeholder:text-foreground/30 focus:border-foreground focus:outline-none transition-colors";

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
