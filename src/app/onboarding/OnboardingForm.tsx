"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  ImageOff,
  Loader2,
  Lock,
  Package,
} from "lucide-react";
import { useActionState, useMemo, useState, type ComponentType, type SVGProps } from "react";
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

// Steps for the "full" wizard. pin-only mode skips straight to security.
type StepId = "identity" | "gear" | "security";

const STEPS: ReadonlyArray<{
  id: StepId;
  label: string;
  title: string;
  motivation: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  {
    id: "identity",
    label: "Identidad",
    title: "¿Quién conquista?",
    motivation:
      "El Atlas necesita saber tu nombre y desde dónde partes — así sabe a quién felicitar cuando llegues a la cima.",
    icon: Compass,
  },
  {
    id: "gear",
    label: "Equipaje",
    title: "Tu equipaje BØLG",
    motivation:
      "Marca los modelos que ya tienes para empezar tu equipaje. Esto es opcional — puedes saltártelo y agregar más después.",
    icon: Package,
  },
  {
    id: "security",
    label: "Seguridad",
    title: "Tu llave rápida",
    motivation:
      "Un PIN de 4 dígitos para que la próxima vez entres sin esperar el correo. Memorízalo bien — si lo olvidas, lo cambias con magic link.",
    icon: Lock,
  },
];

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export function OnboardingForm({ mode, initialDisplayName, catalog }: Props) {
  const isPinOnly = mode === "pin-only";

  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [city, setCity] = useState<City | undefined>(undefined);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState("");
  const [instagram, setInstagram] = useState("");

  // Wizard step index. pin-only mode forces step 2 (security) immediately.
  const [stepIdx, setStepIdx] = useState<number>(isPinOnly ? 2 : 0);
  const currentStep = STEPS[stepIdx]!;

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

  // Per-step validity. In pin-only mode, only security matters.
  const identityValid = useMemo(() => {
    if (isPinOnly) return true;
    const dn = displayName.trim();
    const un = username.trim().toLowerCase();
    return dn.length >= 1 && dn.length <= 80 && USERNAME_RE.test(un);
  }, [isPinOnly, displayName, username]);

  // Gear step has no required fields — always valid.
  const securityValid = pin.length === 4 && pinConfirm.length === 4 && pin === pinConfirm;

  function goNext() {
    if (stepIdx === 0 && !identityValid) return;
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  }

  function goPrev() {
    setStepIdx((i) => Math.max(isPinOnly ? 2 : 0, i - 1));
  }

  // For the wizard's progress, pin-only is a single-step flow.
  const totalSteps = isPinOnly ? 1 : STEPS.length;
  const displayStepNumber = isPinOnly ? 1 : stepIdx + 1;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="mode" value={mode} />
      {!isPinOnly && (
        <input
          type="hidden"
          name="selected_models"
          value={selectedModels.join(",")}
        />
      )}

      {/* Progress indicator */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
            Paso {displayStepNumber} de {totalSteps}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
            {currentStep.label}
          </span>
        </div>
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0,1fr))` }}
          aria-hidden
        >
          {Array.from({ length: totalSteps }).map((_, i) => {
            const active = isPinOnly ? true : i <= stepIdx;
            return (
              <span
                key={i}
                className={cn(
                  "h-[3px] transition-colors",
                  active ? "bg-foreground" : "bg-border",
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Step header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center border border-border text-foreground/70">
            <currentStep.icon className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="font-display text-2xl font-black leading-[1.1] tracking-tight md:text-3xl">
            {currentStep.title}
          </h2>
        </div>
        <p className="max-w-lg text-sm leading-relaxed text-foreground/65">
          {currentStep.motivation}
        </p>
      </header>

      {/* IDENTITY — only in full mode */}
      {!isPinOnly && (
        <section
          className={cn(
            "flex flex-col gap-6",
            stepIdx === 0 ? "block" : "hidden",
          )}
          aria-hidden={stepIdx !== 0}
        >
          <Field
            label="Nombre"
            hint="Tu nombre completo como quieres aparecer en tu perfil. Espacios, tildes y mayúsculas OK."
            required
          >
            <input
              name="display_name"
              type="text"
              minLength={1}
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              placeholder="Juan Pérez"
              className={inputCls}
            />
          </Field>

          <Field
            label="Nombre de usuario"
            hint="En minúscula, sin espacios."
            required
          >
            <input
              name="username"
              type="text"
              minLength={3}
              maxLength={30}
              pattern="^[a-z0-9_]+$"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))
              }
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
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="bolgconcept"
              className={inputCls}
            />
          </Field>
        </section>
      )}

      {/* GEAR — only in full mode */}
      {!isPinOnly && (
        <section
          className={cn(
            "flex flex-col gap-5",
            stepIdx === 1 ? "block" : "hidden",
          )}
          aria-hidden={stepIdx !== 1}
        >
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

          {catalog.length === 0 ? (
            <div className="flex flex-col items-start gap-2 border border-dashed border-border px-4 py-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                Catálogo en preparación
              </span>
              <p className="max-w-md text-sm leading-relaxed text-foreground/60">
                El equipaje BØLG aún no está cargado. Saltea este paso por ahora
                — vas a poder marcar tus modelos desde tu perfil apenas estén
                disponibles.
              </p>
            </div>
          ) : (
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
          )}
        </section>
      )}

      {/* SECURITY — shown in both modes (last step) */}
      <section
        className={cn(
          "flex flex-col gap-6",
          stepIdx === 2 ? "block" : "hidden",
        )}
        aria-hidden={stepIdx !== 2}
      >
        <Field label="PIN (4 dígitos)" hint="Solo números." required>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            autoComplete="new-password"
            autoFocus={isPinOnly}
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

      {state.status === "error" && (
        <p
          role="alert"
          className="border-l-2 border-destructive bg-destructive/[0.06] px-3 py-2 font-mono text-xs leading-relaxed text-destructive"
        >
          {state.message}
        </p>
      )}

      {/* Wizard nav */}
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {!isPinOnly && stepIdx > 0 ? (
          <button
            type="button"
            onClick={goPrev}
            disabled={isPending}
            className="flex min-h-[44px] items-center justify-center gap-2 border border-border bg-transparent px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-foreground/70 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-30 sm:w-auto"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden />
            Atrás
          </button>
        ) : (
          <span className="hidden sm:block" />
        )}

        {stepIdx < 2 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={stepIdx === 0 ? !identityValid : false}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background transition-colors hover:bg-foreground/80 disabled:opacity-30 sm:w-auto"
          >
            {stepIdx === 1 && selectedModels.length === 0
              ? "Saltar este paso"
              : "Siguiente"}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending || !securityValid}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background transition-colors hover:bg-foreground/80 disabled:opacity-30 sm:w-auto"
          >
            {isPending ? (
              <>
                Guardando
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              </>
            ) : (
              <>
                Comenzar a conquistar
                <ArrowRight className="h-3 w-3" aria-hidden />
              </>
            )}
          </button>
        )}
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
