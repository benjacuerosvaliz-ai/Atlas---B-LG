"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ActivityEvent } from "@/app/atlas/loader";
import { countryFlag } from "@/lib/country-name";
import { cn } from "@/lib/utils";

/**
 * Auto-rotating live activity chip — rotates through recent conquests one at
 * a time. Stays in place; the text fades in/out per event for that "feeling
 * alive" effect without breaking the layout.
 */
export function ActivityTicker({ events }: { events: ActivityEvent[] }) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (events.length === 0) return;
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % events.length);
        setFading(false);
      }, 250);
    }, 3800);
    return () => clearInterval(id);
  }, [events.length]);

  if (events.length === 0) return null;
  const e = events[idx];

  return (
    <Link
      href={`/u/${e.username}`}
      className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2 border border-border bg-card/85 px-2.5 py-1.5 backdrop-blur-sm transition-colors hover:border-foreground/70 sm:max-w-[min(70vw,520px)] sm:flex-initial"
    >
      <span className="relative grid h-2 w-2 shrink-0 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-aurora/70" />
        <span className="relative h-2 w-2 rounded-full bg-aurora" />
      </span>
      <span
        className={cn(
          "truncate text-[10px] leading-tight transition-opacity duration-200",
          fading ? "opacity-0" : "opacity-100",
        )}
      >
        <span className="font-mono uppercase tracking-[0.18em] text-foreground/55">
          En vivo ·{" "}
        </span>
        <span className="text-foreground/85">@{e.username}</span>
        <span className="text-foreground/55"> conquistó </span>
        <span className="font-medium text-foreground">
          {countryFlag(e.countryCode)} {e.cityName}
        </span>
        {e.bolgVisible && (
          <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.2em] text-aurora">
            BØLG
          </span>
        )}
      </span>
    </Link>
  );
}
