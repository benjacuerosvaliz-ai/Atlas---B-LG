"use client";

import { ArrowRight, Check, ImageOff, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { CityPicker } from "@/components/city-picker";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import { createTrip } from "./actions";
import {
  EMPTY_FORM,
  MONTH_NAMES_ES,
  type ProductModelLite,
  type TripFormData,
} from "./types";

const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  catalog: ProductModelLite[];
  userCity: string | null;
};

const CURRENT_YEAR = new Date().getFullYear();
// Permitimos viajes hasta 10 años atrás. Para viajes futuros: el ranking
// del PPT premia "primero en subir", así que viajes en el futuro no aplican.
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - i);

export function TripForm({ catalog, userCity }: Props) {
  const [data, setData] = useState<TripFormData>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patch(partial: Partial<TripFormData>) {
    setData((d) => ({ ...d, ...partial }));
  }

  function toggleModel(id: string) {
    patch({
      claimedModelIds: data.claimedModelIds.includes(id)
        ? data.claimedModelIds.filter((x) => x !== id)
        : [...data.claimedModelIds, id],
    });
  }

  async function onPhotoPick(file: File) {
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("La foto tiene que ser una imagen (JPG, PNG, HEIC).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("La foto debe pesar menos de 10 MB.");
      return;
    }
    setUploading(true);
    try {
      const asset = await uploadToCloudinary(file);
      patch({ photo: asset });
    } catch (err) {
      console.error("[trip-form] upload", err);
      setUploadError("La foto no se pudo subir. Reintenta.");
    } finally {
      setUploading(false);
    }
  }

  const isValid = canSubmit(data);

  function submit() {
    setSubmitError(null);
    if (!isValid) return;
    startTransition(async () => {
      const res = await createTrip(data);
      if (res?.error) setSubmitError(res.error);
    });
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-12">
      <header className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
          Sumar al Atlas
        </span>
        <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
          Cargar un viaje.
        </h1>
        <p className="max-w-md text-base leading-relaxed text-foreground/60">
          Dinos a dónde fuiste y desde dónde venías. Si el viaje incluyó
          algún BØLG, márcalo — los viajes con producto destrancan la
          conquista de la ciudad.
        </p>
      </header>

      <section
        className="flex flex-col gap-6 border-t border-border pt-8"
        data-tour="trip-cities"
      >
        <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          ¿Dónde estuviste?
        </span>
        <CityPicker
          label="A dónde fuiste"
          value={data.destinationCity}
          onChange={(c) => patch({ destinationCity: c })}
          placeholder="Pucón, Santiago, Buenos Aires…"
          required
          autoFocus
        />
        <CityPicker
          label="De dónde venías"
          value={data.originCity}
          onChange={(c) => patch({ originCity: c })}
          placeholder="Tu ciudad de origen"
          required
          suggestion={userCity}
        />
      </section>

      <section
        className="flex flex-col gap-4 border-t border-border pt-8"
        data-tour="trip-date"
      >
        <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          ¿Cuándo?
        </span>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mes" required>
            <select
              required
              value={data.month ?? ""}
              onChange={(e) =>
                patch({ month: e.target.value ? Number(e.target.value) : undefined })
              }
              className={selectCls}
            >
              <option value="">Elige...</option>
              {MONTH_NAMES_ES.map((name, idx) => (
                <option key={idx} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Año" required>
            <select
              required
              value={data.year ?? ""}
              onChange={(e) =>
                patch({ year: e.target.value ? Number(e.target.value) : undefined })
              }
              className={selectCls}
            >
              <option value="">Elige...</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section
        className="flex flex-col gap-4 border-t border-border pt-8"
        data-tour="trip-photo"
      >
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
            Foto del viaje
          </span>
          <p className="max-w-md text-sm leading-relaxed text-foreground/55">
            Opcional pero recomendado. Una sola, máx 10 MB. Aparece sobre el
            mapa como tu marca en esa ciudad.
          </p>
        </div>

        {uploading && (
          <div className="flex items-center gap-3 border-2 border-foreground bg-foreground/[0.04] px-4 py-3">
            <Loader2 className="h-5 w-5 animate-spin text-foreground" />
            <span className="text-sm">Subiendo tu foto...</span>
          </div>
        )}

        {data.photo ? (
          <div className="relative max-w-xs overflow-hidden bg-fog">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.photo.url}
              alt=""
              className="h-auto w-full object-cover"
            />
            <button
              type="button"
              onClick={() => patch({ photo: undefined })}
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center bg-ink/80 text-bone transition-colors hover:bg-ink"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-border px-6 py-10 text-center text-sm text-foreground/65 transition-colors hover:border-foreground/60">
            <span>Toca para elegir una foto</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/40">
              JPG, PNG o HEIC
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPhotoPick(f);
                e.target.value = "";
              }}
              disabled={uploading}
            />
          </label>
        )}

        {uploadError && (
          <p className="border-l-2 border-destructive bg-destructive/[0.06] px-3 py-2 font-mono text-xs text-destructive">
            {uploadError}
          </p>
        )}
      </section>

      {catalog.length > 0 && (
        <section
          className="flex flex-col gap-4 border-t border-border pt-8"
          data-tour="trip-bolg"
        >
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
              ¿Llevaste tu BØLG?
            </span>
            <p className="max-w-md text-sm leading-relaxed text-foreground/55">
              Marca el o los productos que viajaron contigo. Los viajes con
              BØLG destrancan la conquista de la ciudad — le ganan a quien
              llegó primero sin producto.
            </p>
          </div>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {catalog.map((m) => {
              const selected = data.claimedModelIds.includes(m.id);
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
      )}

      <div className="flex items-center justify-end gap-4 border-t border-border pt-8">
        {submitError && (
          <p className="flex-1 font-mono text-xs text-destructive">{submitError}</p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!isValid || isPending || uploading}
          className="flex items-center gap-2 bg-foreground px-6 py-4 text-[10px] uppercase tracking-[0.28em] text-background transition-colors hover:bg-foreground/80 disabled:opacity-30"
        >
          {isPending ? (
            <>
              Subiendo
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            </>
          ) : (
            <>
              Cargar viaje
              <ArrowRight className="h-3 w-3" aria-hidden />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function canSubmit(data: TripFormData): boolean {
  return (
    !!data.originCity &&
    !!data.destinationCity &&
    !!data.month &&
    !!data.year
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
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
    </div>
  );
}

const selectCls =
  "w-full appearance-none border-b border-border bg-transparent py-3 text-base focus:border-foreground focus:outline-none transition-colors cursor-pointer";
