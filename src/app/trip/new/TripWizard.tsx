"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useTransition } from "react";
import { easeOutExpo } from "@/lib/tokens";
import { createTrip } from "./actions";
import { StepActivity } from "./steps/StepActivity";
import { StepDates } from "./steps/StepDates";
import { StepPhotos } from "./steps/StepPhotos";
import { StepPlace } from "./steps/StepPlace";
import { StepPreview } from "./steps/StepPreview";
import { StepProducts } from "./steps/StepProducts";
import { EMPTY_FORM, type ProductModelLite, type TripFormData } from "./types";

const STEPS = [
  { id: "place", label: "Lugar" },
  { id: "dates", label: "Fechas" },
  { id: "activity", label: "Actividad" },
  { id: "photos", label: "Fotos" },
  { id: "products", label: "Productos" },
  { id: "preview", label: "Revisar" },
] as const;

type Props = { catalog: ProductModelLite[]; userCity: string | null };

export function TripWizard({ catalog, userCity }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TripFormData>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  function patch(partial: Partial<TripFormData>) {
    setData((d) => ({ ...d, ...partial }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await createTrip(data);
      if (result?.error) {
        setSubmitError(result.error);
      }
    });
  }

  const canAdvance = isStepComplete(step, data);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-12">
      <StepIndicator current={step} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={STEPS[step].id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.32, ease: easeOutExpo }}
          className="min-h-[420px]"
        >
          {step === 0 && (
            <StepPlace data={data} patch={patch} userCity={userCity} />
          )}
          {step === 1 && <StepDates data={data} patch={patch} />}
          {step === 2 && <StepActivity data={data} patch={patch} />}
          {step === 3 && <StepPhotos data={data} patch={patch} />}
          {step === 4 && (
            <StepProducts data={data} patch={patch} catalog={catalog} />
          )}
          {step === 5 && <StepPreview data={data} catalog={catalog} />}
        </motion.div>
      </AnimatePresence>

      {submitError && (
        <p className="font-mono text-xs text-destructive">{submitError}</p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-6">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || isPending}
          className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-foreground/60"
        >
          ← Atrás
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance}
            className="flex items-center gap-2 border-b-2 border-foreground/0 px-1 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:hover:border-foreground/0"
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canAdvance || isPending}
            className="flex items-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors disabled:opacity-30"
          >
            {isPending ? "Guardando..." : "Crear viaje →"}
          </button>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        {STEPS.map((s, idx) => (
          <div
            key={s.id}
            className="h-[2px] flex-1 transition-colors"
            style={{
              backgroundColor:
                idx <= current ? "var(--color-foreground)" : "var(--color-border)",
            }}
          />
        ))}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40">
          Paso {current + 1} / {STEPS.length}
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/60">
          · {STEPS[current].label}
        </span>
      </div>
    </div>
  );
}

function isStepComplete(step: number, data: TripFormData): boolean {
  switch (step) {
    case 0:
      return !!data.startPlace;
    case 1:
      return !!data.startAt;
    case 2:
      return (
        !!data.activityType &&
        typeof data.distanceKm === "number" &&
        data.distanceKm >= 0
      );
    case 3:
      return true; // photos optional
    case 4:
      // If user claimed any model, require >=1 photo as evidence.
      if (data.claimedModelIds.length > 0 && data.photos.length === 0) {
        return false;
      }
      return true;
    case 5:
      return (
        !!data.startPlace &&
        !!data.startAt &&
        !!data.activityType &&
        (data.claimedModelIds.length === 0 || data.photos.length > 0)
      );
    default:
      return false;
  }
}
