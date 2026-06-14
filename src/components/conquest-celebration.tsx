"use client";

import { ArrowRight, Check, Copy, MapPin, Share2, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Pantalla de celebración tras subir un viaje. Solo se renderiza si
 * el querystring incluye ?conquistado=1. Bloquea scroll, hace fade-in,
 * permite cerrar con ESC o el botón ✕.
 *
 * Mostrar/no mostrar el badge de "Primer BØLG" lo decide el server.
 * Acá solo somos el escenario.
 */
export type ConquestCelebrationProps = {
  destination: string;
  destinationFlag: string;
  distanceKm: number;
  newCitiesCount: number;
  newCountriesCount: number;
  isFirstBolgConquistador: boolean;
  myRankAfter: number | null;
  tripUrl: string;
  authedUsername: string | null;
};

export function ConquestCelebration(props: ConquestCelebrationProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shouldShow = searchParams.get("conquistado") === "1";
  const [open, setOpen] = useState(shouldShow);
  const [animatedKm, setAnimatedKm] = useState(0);

  useEffect(() => {
    if (!shouldShow) return;
    setOpen(true);
    document.body.style.overflow = "hidden";
    // Count-up animation
    const target = props.distanceKm;
    const start = performance.now();
    const dur = 1100;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedKm(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return () => {
      document.body.style.overflow = "";
    };
  }, [shouldShow, props.distanceKm]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function close() {
    setOpen(false);
    document.body.style.overflow = "";
    // remove the ?conquistado=1 so refresh doesn't reopen
    const url = new URL(window.location.href);
    url.searchParams.delete("conquistado");
    router.replace(url.pathname + (url.search ? url.search : ""), {
      scroll: false,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/95 px-4 py-6 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      {/* Radial pulse decoration */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="h-[600px] w-[600px] animate-pulse rounded-full bg-aurora/[0.04] blur-3xl" />
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center border border-border bg-card/80 text-foreground/55 backdrop-blur-sm transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative z-[1] flex w-full max-w-xl flex-col gap-8 border border-border bg-card/95 p-6 backdrop-blur-md md:p-10">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.36em] text-aurora">
            Conquista registrada
          </span>
          <h2 className="flex items-baseline gap-3 font-display text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
            <span aria-hidden className="text-4xl md:text-5xl">
              {props.destinationFlag}
            </span>
            {props.destination}.
          </h2>
        </div>

        {props.isFirstBolgConquistador && (
          <div className="flex items-center gap-3 border-2 border-aurora bg-aurora/[0.06] px-4 py-3">
            <Trophy className="h-5 w-5 shrink-0 text-aurora" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.28em] text-aurora">
                Primer conquistador BØLG
              </span>
              <span className="text-sm leading-tight text-foreground/85">
                Eres el primero en pisar {props.destination} con un BØLG.
                Tu nombre queda como conquistador hasta que te destronen.
              </span>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 border-y border-border py-5">
          <Stat
            value={animatedKm.toLocaleString("es-CL")}
            suffix="km"
            label="Sumados"
          />
          <Stat
            value={`+${props.newCitiesCount}`}
            label={props.newCitiesCount === 1 ? "Ciudad nueva" : "Ciudades nuevas"}
          />
          <Stat
            value={`+${props.newCountriesCount}`}
            label={props.newCountriesCount === 1 ? "País nuevo" : "Países nuevos"}
          />
        </div>

        {props.myRankAfter !== null && props.myRankAfter <= 10 && (
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Trophy className="h-4 w-4 text-ember" />
            Estás en el puesto{" "}
            <span className="font-display text-lg font-black tabular-nums text-foreground">
              #{props.myRankAfter}
            </span>{" "}
            del Ranking Mundial.
          </div>
        )}

        <ShareRow
          username={props.authedUsername}
          destination={props.destination}
          tripUrl={props.tripUrl}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <Link
            href="/"
            className="group flex flex-1 items-center justify-center gap-2 bg-foreground px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-background transition-colors hover:bg-foreground/80"
          >
            <MapPin className="h-3 w-3" />
            Ver en el mapa
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/trip/new"
            className="flex flex-1 items-center justify-center gap-2 border border-foreground/70 px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-foreground transition-colors hover:bg-foreground/[0.06]"
          >
            Cargar otro
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  suffix,
  label,
}: {
  value: string;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-2xl font-black leading-none tabular-nums tracking-tight md:text-3xl">
        {value}
        {suffix && (
          <span className="ml-1 font-mono text-xs text-foreground/40 md:text-sm">
            {suffix}
          </span>
        )}
      </span>
      <span className="text-[9px] uppercase tracking-[0.28em] text-foreground/50">
        {label}
      </span>
    </div>
  );
}

function ShareRow({
  username,
  destination,
  tripUrl,
}: {
  username: string | null;
  destination: string;
  tripUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const shareText = username
    ? `Acabo de conquistar ${destination} en el Atlas BØLG. Mírame: ${tripUrl}`
    : `Mira mi conquista en el Atlas BØLG: ${tripUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(tripUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copia el link:", tripUrl);
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      copy();
      return;
    }
    try {
      await navigator.share({
        title: `Conquista BØLG — ${destination}`,
        text: shareText,
        url: tripUrl,
      });
    } catch {
      // user canceled
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/50">
        Compartir tu conquista
      </span>
      <div className="flex flex-wrap gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
        >
          <WhatsAppGlyph />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={nativeShare}
          className="flex items-center gap-2 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
        >
          <Share2 className="h-3 w-3" />
          Más
        </button>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "flex items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-[0.28em] transition-colors",
            copied
              ? "border-aurora text-aurora"
              : "border-border text-foreground/70 hover:border-foreground hover:text-foreground",
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.768.967-.941 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
