"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TripFormData } from "../types";

type Props = {
  data: TripFormData;
  patch: (partial: Partial<TripFormData>) => void;
};

function toIso(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  return format(d, "yyyy-MM-dd");
}

function fromIso(s: string | undefined): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function StepDates({ data, patch }: Props) {
  const start = fromIso(data.startAt);
  const end = fromIso(data.endAt);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
          ¿Cuándo fue?
        </span>
        <h2 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
          Las fechas que lo cuentan.
        </h2>
        <p className="max-w-md text-base leading-relaxed text-foreground/60">
          Inicio obligatorio. Si fue un viaje de varios días, marca también el
          fin — pintamos el cuadrito completo en tu timeline.
        </p>
      </div>

      <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
        <DateField
          label="Inicio"
          required
          value={start}
          onChange={(d) => patch({ startAt: toIso(d) })}
        />
        <DateField
          label="Fin (opcional)"
          value={end}
          minDate={start}
          onChange={(d) => patch({ endAt: toIso(d) })}
        />
      </div>
    </div>
  );
}

function DateField({
  label,
  required,
  value,
  onChange,
  minDate,
}: {
  label: string;
  required?: boolean;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  minDate?: Date;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <label className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      <Popover>
        <PopoverTrigger className="flex w-full items-center justify-between border-b border-border bg-transparent py-3 text-left text-base hover:border-foreground transition-colors">
          <span className={value ? "" : "text-foreground/30"}>
            {value
              ? format(value, "d 'de' MMMM, yyyy", { locale: es })
              : "Elegir fecha"}
          </span>
          <CalendarIcon className="h-4 w-4 text-foreground/40" aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={(d) =>
              (minDate ? d < minDate : false) || d > new Date()
            }
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
