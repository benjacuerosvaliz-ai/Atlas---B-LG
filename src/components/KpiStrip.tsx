"use client";

import { animate } from "framer-motion";
import { useEffect, useState } from "react";
import { easeOutExpo } from "@/lib/tokens";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-CL");

function CountUp({ to, durationMs = 1800 }: { to: number; durationMs?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, to, {
      duration: durationMs / 1000,
      ease: easeOutExpo,
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [to, durationMs]);

  return <span>{NUMBER_FORMATTER.format(Math.floor(value))}</span>;
}

type KpiItemProps = {
  value: number;
  label: string;
  suffix?: string;
};

function KpiItem({ value, label, suffix }: KpiItemProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-bold tabular-nums tracking-tight md:text-4xl">
          <CountUp to={value} />
        </span>
        {suffix && (
          <span className="font-mono text-xs text-foreground/40 md:text-sm">{suffix}</span>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">{label}</span>
    </div>
  );
}

type KpiStripProps = {
  totalKm: number;
  totalTrips: number;
  totalCountries: number;
  totalUsers: number;
};

export function KpiStrip({
  totalKm,
  totalTrips,
  totalCountries,
  totalUsers,
}: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-6">
      <KpiItem value={totalKm} label="Kilómetros" suffix="km" />
      <KpiItem value={totalTrips} label="Aventuras" />
      <KpiItem value={totalCountries} label="Países" />
      <KpiItem value={totalUsers} label="Clientes" />
    </div>
  );
}
