"use client";

import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Chip que muestra cuántos días quedan para el premio mensual. Es
 * inherentemente time-dependent, así que vivimos como client component
 * para evitar hydration mismatch entre SSR y el navegador.
 */
export function MonthlyPrizeChip() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diff = Math.max(
      0,
      Math.ceil((lastDay.getTime() - now.getTime()) / 86_400_000),
    );
    setDaysLeft(diff);
  }, []);

  if (daysLeft === null) return null;
  const word = daysLeft === 1 ? "día" : "días";

  return (
    <div
      className="flex shrink-0 items-center gap-1.5 border border-ember/50 bg-ember/[0.07] px-2 py-1.5 text-ember"
      title="Cada mes el #1 del ranking se lleva un parche bordado + $100.000 CLP + un llavero edición limitada + el reposteo en RRSS."
    >
      <Trophy className="h-3 w-3 shrink-0" />
      {/* Mobile: solo días — Desktop: copy completa */}
      <span className="text-[9px] uppercase tracking-[0.28em] sm:hidden">
        {daysLeft}d
      </span>
      <span className="hidden text-[9px] uppercase tracking-[0.28em] sm:inline">
        Premio en {daysLeft} {word}
      </span>
    </div>
  );
}
