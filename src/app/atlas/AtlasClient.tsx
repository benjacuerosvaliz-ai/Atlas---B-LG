"use client";

import { ArrowRight, ChevronRight, Plus, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { OnboardingTour } from "@/components/onboarding-tour";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CONTINENT_NAMES, type ContinentCode } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type {
  CountryStatus,
  Kpis,
  TopTraveler,
} from "./loader";

// SSR causa problemas con react-simple-maps (fetch del topojson y SVG
// sizing necesitan window). Dynamic import client-only.
const WorldMap = dynamic(() => import("@/components/world-map").then((m) => m.WorldMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-fog">
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40">
        Cargando mapa...
      </span>
    </div>
  ),
});

type Props = {
  authedUsername: string | null;
  globalKpis: Kpis;
  personalKpis: Kpis | null;
  statusByCountryGlobal: Record<string, CountryStatus>;
  statusByCountryPersonal: Record<string, CountryStatus> | null;
  topTravelers: TopTraveler[];
};

type Mode = "global" | "personal";

function countryDisplayName(code: string): string {
  try {
    const dn = new Intl.DisplayNames(["es"], { type: "region" });
    return dn.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 127397 + c.charCodeAt(0)),
  );
}

export function AtlasClient(props: Props) {
  const {
    authedUsername,
    globalKpis,
    personalKpis,
    statusByCountryGlobal,
    statusByCountryPersonal,
    topTravelers,
  } = props;
  const [mode, setMode] = useState<Mode>("global");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Si el usuario no está autenticado, forzamos modo global.
  const effectiveMode: Mode = authedUsername ? mode : "global";
  const kpis = effectiveMode === "personal" ? personalKpis ?? globalKpis : globalKpis;
  const statusByCountry =
    effectiveMode === "personal"
      ? statusByCountryPersonal ?? statusByCountryGlobal
      : statusByCountryGlobal;

  // Lista de países visibles ordenada para el HUD inferior. Solo aparecen
  // países con al menos partial — el "none" no se chip-ea.
  const countryChips = useMemo(() => {
    const out: Array<{ code: string; status: CountryStatus }> = [];
    for (const [code, status] of Object.entries(statusByCountry)) {
      if (status !== "none") out.push({ code, status });
    }
    // Complete primero, partial después; alfabético dentro.
    out.sort((a, b) => {
      if (a.status === b.status) return a.code.localeCompare(b.code);
      return a.status === "complete" ? -1 : 1;
    });
    return out;
  }, [statusByCountry]);

  const selectedCountryName = selectedCountry
    ? countryDisplayName(selectedCountry)
    : null;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* Header */}
      <header
        className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-4 md:px-8 md:py-5"
        data-tour="header"
      >
        <BolgWordmark href="/" />
        <div className="flex items-center gap-3 md:gap-5">
          {topTravelers.length > 0 && (
            <TopTravelersChip travelers={topTravelers} />
          )}
          <Link
            href="/sobre"
            className="hidden text-[10px] uppercase tracking-[0.28em] text-foreground/55 transition-colors hover:text-foreground sm:inline"
          >
            ¿Primera vez? →
          </Link>
          {authedUsername ? (
            <Link
              href="/dashboard"
              className="text-[10px] uppercase tracking-[0.28em] text-foreground transition-colors hover:text-foreground/70"
            >
              Mi panel →
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[10px] uppercase tracking-[0.28em] text-foreground transition-colors hover:text-foreground/70"
            >
              Ingresar
            </Link>
          )}
        </div>
      </header>

      {/* Mode toggle + KPIs strip (top center, below header) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[72px] z-20 flex justify-center px-4 md:top-[84px]"
        data-tour="kpis"
      >
        <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 border border-border bg-card/85 px-4 py-3 backdrop-blur-sm md:px-6 md:py-4">
          {authedUsername && (
            <div className="flex gap-2 border-b border-border pb-2">
              <ModeButton
                active={mode === "global"}
                onClick={() => setMode("global")}
              >
                Global
              </ModeButton>
              <ModeButton
                active={mode === "personal"}
                onClick={() => setMode("personal")}
              >
                Personal
              </ModeButton>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            <Kpi value={kpis.totalKm} label="Km" />
            <Kpi value={kpis.citiesVisited} label="Ciudades" />
            <Kpi value={kpis.countriesRecorridos} label="Países" />
            <Kpi value={kpis.continentsConocidos} label="Continentes" />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 z-0" data-tour="map">
        <WorldMap
          statusByCountry={statusByCountry}
          selectedCountry={selectedCountry}
          onCountryClick={(c) => setSelectedCountry((curr) => (curr === c ? null : c))}
        />
      </div>

      {/* Country chips strip + community CTA — bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 px-4 pb-5 md:px-8 md:pb-6">
        <div
          className="pointer-events-auto flex flex-col gap-3 border border-border bg-card/85 p-3 backdrop-blur-sm md:p-4"
          data-tour="hud"
        >
          {countryChips.length > 0 ? (
            <div className="-mx-3 overflow-x-auto px-3 md:-mx-4 md:px-4">
              <div className="flex min-w-min items-center gap-2">
                {countryChips.map((c) => {
                  const active = c.code === selectedCountry;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() =>
                        setSelectedCountry((curr) =>
                          curr === c.code ? null : c.code,
                        )
                      }
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.24em] transition-colors",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : c.status === "complete"
                            ? "border-foreground/70 text-foreground"
                            : "border-border text-foreground/65 hover:border-foreground/70 hover:text-foreground",
                      )}
                    >
                      <span className="text-sm leading-none">
                        {countryFlag(c.code)}
                      </span>
                      <span>{countryDisplayName(c.code)}</span>
                      {c.status === "complete" && (
                        <span
                          className={cn(
                            "font-mono text-[9px]",
                            active ? "text-background/70" : "text-aurora",
                          )}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/50">
              Sin viajes registrados todavía. Sé el primer conquistador.
            </p>
          )}

          {!authedUsername && (
            <Link
              href="/login"
              className="group -mx-3 -mb-3 flex items-center justify-center gap-2 border-t border-border bg-foreground/[0.03] px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.32em] text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground md:-mx-4 md:-mb-4 md:px-4"
              data-tour="join"
            >
              Hazte parte de la comunidad
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Floating "Cargar viaje" CTA for authed users */}
      {authedUsername && (
        <Link
          href="/trip/new"
          className="absolute bottom-[120px] right-4 z-20 flex items-center gap-2 bg-foreground px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-background shadow-lg transition-colors hover:bg-foreground/80 md:bottom-[140px] md:right-8"
          data-tour="upload"
        >
          <Plus className="h-3 w-3" />
          Cargar viaje
        </Link>
      )}

      {/* Onboarding tour (anónimos primera vez + botón "?" siempre disponible) */}
      <OnboardingTour authedUsername={authedUsername} />

      {/* Country drill-down panel */}
      {selectedCountry && (
        <CountryPanel
          name={selectedCountryName ?? ""}
          flag={countryFlag(selectedCountry)}
          continent={getContinent(selectedCountry)}
          status={statusByCountry[selectedCountry] ?? "none"}
          onClose={() => setSelectedCountry(null)}
          showInvite={!authedUsername}
        />
      )}
    </div>
  );
}

function getContinent(countryCode: string): string {
  // Import lazily to avoid client bundle bloat.
  const { COUNTRY_TO_CONTINENT } = require("@/lib/geo") as typeof import("@/lib/geo");
  const c = COUNTRY_TO_CONTINENT[countryCode] as ContinentCode | undefined;
  return c ? CONTINENT_NAMES[c] : "";
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1 text-[10px] uppercase tracking-[0.32em] transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-foreground/55 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Kpi({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-lg font-black leading-none tabular-nums tracking-tight md:text-2xl">
        {value.toLocaleString("es-CL")}
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-[0.28em] text-foreground/50 md:text-[10px]">
        {label}
      </span>
    </div>
  );
}

function TopTravelersChip({ travelers }: { travelers: TopTraveler[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      data-tour="top"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label="Ver top viajeros"
        className="flex items-center gap-1.5 border border-border bg-card/85 px-2 py-1.5 backdrop-blur-sm transition-colors hover:border-foreground/70"
      >
        <span className="text-[9px] uppercase tracking-[0.28em] text-foreground/55">
          Top
        </span>
        <div className="flex -space-x-2">
          {travelers.slice(0, 3).map((t) => (
            <Avatar key={t.id} className="h-6 w-6 border border-card bg-fog">
              {t.avatarUrl && (
                <AvatarImage src={t.avatarUrl} alt={t.displayName ?? t.username} />
              )}
              <AvatarFallback className="bg-fog text-[9px] font-black text-foreground/75">
                {initialsFrom(t.displayName ?? t.username)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </button>
      {expanded && (
        <ul className="absolute right-0 top-full z-40 mt-2 flex w-64 flex-col border border-border bg-card/95 backdrop-blur-sm">
          {travelers.map((t, idx) => (
            <li key={t.id}>
              <Link
                href={`/u/${t.username}`}
                className="group flex items-center gap-3 border-b border-border/60 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-foreground/[0.04]"
              >
                <span className="w-5 shrink-0 font-mono text-[10px] tabular-nums text-foreground/45">
                  #{idx + 1}
                </span>
                <Avatar className="h-9 w-9 shrink-0 bg-fog">
                  {t.avatarUrl && (
                    <AvatarImage
                      src={t.avatarUrl}
                      alt={t.displayName ?? t.username}
                    />
                  )}
                  <AvatarFallback className="bg-fog text-[10px] font-black text-foreground/75">
                    {initialsFrom(t.displayName ?? t.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm">
                    {t.displayName ?? `@${t.username}`}
                  </span>
                  <span className="truncate font-mono text-[10px] tabular-nums text-foreground/55">
                    {Math.round(t.totalKm).toLocaleString("es-CL")} km
                  </span>
                </div>
                <ChevronRight className="h-3 w-3 shrink-0 text-foreground/35 transition-colors group-hover:text-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CountryPanel({
  name,
  flag,
  continent,
  status,
  onClose,
  showInvite,
}: {
  name: string;
  flag: string;
  continent: string;
  status: CountryStatus;
  onClose: () => void;
  showInvite: boolean;
}) {
  const STATUS_COPY: Record<CountryStatus, string> = {
    complete: "Conquista completa",
    partial: "Conquista parcial",
    none: "Aún sin conquistar",
  };
  return (
    <div
      className={cn(
        "absolute z-40 flex flex-col gap-3 border border-border bg-card/95 backdrop-blur-md",
        "md:right-6 md:top-[180px] md:bottom-[160px] md:w-[360px] md:max-w-[40vw]",
        "inset-x-3 bottom-[180px] top-[180px] md:inset-auto",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/55">
            {continent}
          </span>
          <h2 className="flex items-center gap-2 font-display text-2xl font-black leading-tight tracking-tight">
            <span className="text-3xl leading-none">{flag}</span>
            {name}
          </h2>
          <span
            className={cn(
              "mt-1 inline-flex w-fit items-center gap-1.5 border px-2 py-1 text-[10px] uppercase tracking-[0.28em]",
              status === "complete"
                ? "border-aurora text-aurora"
                : status === "partial"
                  ? "border-foreground/60 text-foreground/70"
                  : "border-border text-foreground/50",
            )}
          >
            {STATUS_COPY[status]}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-foreground/50 transition-colors hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
        <p className="font-mono text-xs leading-relaxed text-foreground/65">
          {status === "none"
            ? `Nadie ha registrado viajes en ${name} todavía. El primero en cargar uno se convierte en su conquistador.`
            : status === "partial"
              ? `Hay viajes BØLG en algunas ciudades de ${name}. Sigue habiendo ciudades por conquistar.`
              : `Todas las ciudades conocidas de ${name} tienen un conquistador.`}
        </p>
      </div>

      {showInvite && (
        <Link
          href="/login"
          className="group flex items-center justify-center gap-2 border-t border-border bg-foreground/[0.03] px-4 py-3 text-center text-[10px] uppercase tracking-[0.32em] text-foreground/75 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          Hazte parte de la comunidad
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function initialsFrom(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "·"
  );
}
