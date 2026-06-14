"use client";

import { ArrowRight, Plus, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityTicker } from "@/components/activity-ticker";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { MonthlyPrizeChip } from "@/components/monthly-prize-chip";
import { OnboardingTour } from "@/components/onboarding-tour";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CONTINENT_NAMES, COUNTRY_TO_CONTINENT, type ContinentCode } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type {
  ActivityEvent,
  CountryStatus,
  Kpis,
  Totals,
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
  totals: Totals;
  statusByCountryGlobal: Record<string, CountryStatus>;
  statusByCountryPersonal: Record<string, CountryStatus> | null;
  topTravelers: TopTraveler[];
  recentActivity: ActivityEvent[];
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
    totals,
    statusByCountryGlobal,
    statusByCountryPersonal,
    topTravelers,
    recentActivity,
  } = props;
  const [heroDismissed, setHeroDismissed] = useState(false);
  const [mode, setMode] = useState<Mode>("global");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Si el usuario no está autenticado, forzamos modo global.
  const effectiveMode: Mode = authedUsername ? mode : "global";
  const kpis = effectiveMode === "personal" ? personalKpis ?? globalKpis : globalKpis;
  const statusByCountry =
    effectiveMode === "personal"
      ? statusByCountryPersonal ?? statusByCountryGlobal
      : statusByCountryGlobal;

  const countryChips = useMemo(() => {
    const out: Array<{ code: string; status: CountryStatus }> = [];
    for (const [code, status] of Object.entries(statusByCountry)) {
      if (status !== "none") out.push({ code, status });
    }
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
          <Link
            href="/ranking"
            className="hidden text-[10px] uppercase tracking-[0.28em] text-foreground/55 transition-colors hover:text-foreground sm:inline"
          >
            Ranking →
          </Link>
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

      {/* Live activity ticker + monthly prize ribbon — just below header */}
      <div className="pointer-events-none absolute inset-x-0 top-[60px] z-[25] flex items-center justify-between gap-2 px-4 md:top-[72px] md:px-8">
        <ActivityTicker events={recentActivity} />
        <div className="pointer-events-auto">
          <MonthlyPrizeChip />
        </div>
      </div>

      {/* Floating color legend — top-left of the map */}
      <ColorLegend />

      {/* Map */}
      <div className="absolute inset-0 z-0" data-tour="map">
        <WorldMap
          statusByCountry={statusByCountry}
          selectedCountry={selectedCountry}
          onCountryClick={(c) => setSelectedCountry((curr) => (curr === c ? null : c))}
        />
      </div>

      {/* Floating "Cargar viaje" CTA for authed users */}
      {authedUsername && (
        <Link
          href="/trip/new"
          className="absolute bottom-[260px] right-4 z-30 flex items-center gap-2 bg-foreground px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-background shadow-lg transition-colors hover:bg-foreground/80 md:bottom-[280px] md:right-8"
          data-tour="upload"
        >
          <Plus className="h-3 w-3" />
          Cargar viaje
        </Link>
      )}

      {/* Bottom panel: Mode toggle → KPIs → Top travelers → Country chips */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 px-4 pb-5 md:px-8 md:pb-6">
        <div
          className="pointer-events-auto flex flex-col divide-y divide-border border border-border bg-card/90 backdrop-blur-sm"
          data-tour="hud"
        >
          {/* Mode toggle (solo si autenticado) */}
          {authedUsername && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 md:px-5">
              <span className="text-[9px] uppercase tracking-[0.32em] text-foreground/45">
                Viendo
              </span>
              <div className="flex gap-1">
                <ModeButton active={mode === "global"} onClick={() => setMode("global")}>
                  Global
                </ModeButton>
                <ModeButton active={mode === "personal"} onClick={() => setMode("personal")}>
                  Personal
                </ModeButton>
              </div>
            </div>
          )}

          {/* KPIs with X/Y fractions */}
          <div className="grid grid-cols-4 gap-2 px-4 py-3 md:gap-4 md:px-5 md:py-4" data-tour="kpis">
            <Kpi value={kpis.totalKm} label="Km" />
            <Kpi value={kpis.citiesVisited} total={totals.cities} label="Ciudades" />
            <Kpi value={kpis.countriesRecorridos} total={totals.countries} label="Países" />
            <Kpi value={kpis.continentsConocidos} total={totals.continents} label="Continentes" />
          </div>

          {/* Top travelers strip */}
          {topTravelers.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 md:px-5" data-tour="top">
              <span className="shrink-0 text-[10px] uppercase tracking-[0.28em] text-foreground/50">
                Top
              </span>
              <div className="-mx-2 flex flex-1 items-center gap-1 overflow-x-auto px-2">
                {topTravelers.map((t, idx) => (
                  <Link
                    key={t.id}
                    href={`/u/${t.username}`}
                    className="group flex shrink-0 items-center gap-2 border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-foreground/[0.04]"
                  >
                    <span className="font-mono text-[10px] tabular-nums text-foreground/45">
                      #{idx + 1}
                    </span>
                    <Avatar className="h-7 w-7 bg-fog">
                      {t.avatarUrl && (
                        <AvatarImage src={t.avatarUrl} alt={t.displayName ?? t.username} />
                      )}
                      <AvatarFallback className="bg-fog text-[9px] font-black text-foreground/75">
                        {initialsFrom(t.displayName ?? t.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[11px]">
                        {t.displayName ?? `@${t.username}`}
                      </span>
                      <span className="font-mono text-[9px] tabular-nums text-foreground/55">
                        {Math.round(t.totalKm).toLocaleString("es-CL")} km
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/ranking"
                className="shrink-0 text-[10px] uppercase tracking-[0.28em] text-foreground/55 transition-colors hover:text-foreground"
              >
                Ver todos →
              </Link>
            </div>
          )}

          {/* Country chips */}
          <div className="px-4 py-3 md:px-5">
            {countryChips.length > 0 ? (
              <div className="-mx-2 overflow-x-auto px-2">
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
          </div>

          {!authedUsername && (
            <Link
              href="/login"
              className="group flex items-center justify-center gap-2 bg-foreground/[0.03] px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.32em] text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground md:px-4"
              data-tour="join"
            >
              Hazte parte de la comunidad
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Anonymous hero hook — manifesto card centered on map */}
      {!authedUsername && !heroDismissed && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-md flex-col gap-4 border-2 border-foreground bg-card/95 p-6 backdrop-blur-md md:p-8">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.36em] text-aurora">
                Atlas BØLG
              </span>
              <button
                type="button"
                onClick={() => setHeroDismissed(true)}
                aria-label="Cerrar"
                className="text-foreground/40 transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 className="font-display text-3xl font-black leading-[1.02] tracking-tight md:text-4xl">
              Conquista el mundo con tu BØLG.
            </h2>
            <p className="text-sm leading-relaxed text-foreground/70">
              Cada ciudad tiene un conquistador. El primero que llega con un
              BØLG queda con su nombre clavado hasta que lo destronen. Cada mes
              el #1 del ranking se lleva un parche edición limitada, $100.000
              CLP y la portada de RRSS.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/login"
                className="group flex flex-1 items-center justify-center gap-2 bg-foreground px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-background transition-colors hover:bg-foreground/80"
              >
                Súmate a conquistar
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={() => setHeroDismissed(true)}
                className="px-5 py-4 text-[10px] uppercase tracking-[0.32em] text-foreground/55 transition-colors hover:text-foreground"
              >
                Solo mirar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding tour */}
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
  const c = COUNTRY_TO_CONTINENT[countryCode] as ContinentCode | undefined;
  return c ? CONTINENT_NAMES[c] : "";
}

function ColorLegend() {
  const [open, setOpen] = useState(true);
  return (
    <div className="pointer-events-none absolute left-4 top-[120px] z-20 md:left-8 md:top-[140px]">
      <div className="pointer-events-auto flex flex-col gap-1.5 border border-border bg-card/85 p-2.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.32em] text-foreground/55 transition-colors hover:text-foreground"
        >
          <span>Colores</span>
          <span className="font-mono text-[9px]">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <ul className="flex flex-col gap-1 pt-1">
            <LegendRow color="#5bc0be" label="Conquista completa" />
            <LegendRow color="#d4a373" label="Conquista parcial" />
            <LegendRow color="#dcd8d0" label="Sin conquistar" />
          </ul>
        )}
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="h-3 w-3 border border-foreground/15"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="font-mono text-[10px] text-foreground/65">{label}</span>
    </li>
  );
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

function Kpi({
  value,
  total,
  label,
}: {
  value: number;
  total?: number;
  label: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-lg font-black leading-none tabular-nums tracking-tight md:text-2xl">
        {value.toLocaleString("es-CL")}
        {typeof total === "number" && (
          <span className="text-foreground/40">
            <span className="px-0.5 text-base font-normal md:text-lg">/</span>
            <span className="text-base font-normal md:text-lg">
              {total.toLocaleString("es-CL")}
            </span>
          </span>
        )}
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-[0.28em] text-foreground/50 md:text-[10px]">
        {label}
      </span>
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
        "md:right-6 md:top-[180px] md:bottom-[280px] md:w-[360px] md:max-w-[40vw]",
        "inset-x-3 top-[180px] bottom-[300px] md:inset-auto",
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

