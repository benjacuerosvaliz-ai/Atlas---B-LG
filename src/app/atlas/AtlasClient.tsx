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
  Bolg100Status,
  ConqueredCity,
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
  conqueredCities: ConqueredCity[];
  bolg100Status: Bolg100Status[];
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
    conqueredCities,
    bolg100Status,
  } = props;
  const [heroDismissed, setHeroDismissed] = useState(false);
  const [mode, setMode] = useState<Mode>("global");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

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

  // Pins: la versión que pasamos al mapa. Mantenemos el shape liviano.
  const cityPins = useMemo(
    () =>
      conqueredCities.map((c) => ({
        cityId: c.id,
        lat: c.latitude,
        lng: c.longitude,
        name: c.name,
        countryCode: c.countryCode,
        bolgVisible: c.bolgVisible,
        conquerorUsername: c.conquerorUsername,
      })),
    [conqueredCities],
  );

  // Lookup para resolver el CityPanel sin volver a buscar.
  const cityById = useMemo(() => {
    const map = new Map<string, ConqueredCity>();
    for (const c of conqueredCities) map.set(c.id, c);
    return map;
  }, [conqueredCities]);

  // Ciudades agrupadas por país — alimenta el CountryPanel.
  const citiesByCountry = useMemo(() => {
    const map = new Map<string, ConqueredCity[]>();
    for (const c of conqueredCities) {
      const key = c.countryCode.toLowerCase();
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    // Orden estable: BØLG primero, luego alfabético por nombre.
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (a.bolgVisible !== b.bolgVisible) return a.bolgVisible ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [conqueredCities]);

  const selectedCountryName = selectedCountry
    ? countryDisplayName(selectedCountry)
    : null;

  const selectedCity = selectedCityId ? cityById.get(selectedCityId) ?? null : null;

  function handleCityClick(cityId: string) {
    setSelectedCityId((curr) => (curr === cityId ? null : cityId));
    setSelectedCountry(null);
  }

  function handleCountryClick(code: string) {
    setSelectedCountry((curr) => (curr === code ? null : code));
    setSelectedCityId(null);
  }

  return (
    <div className="flex w-full flex-col bg-background">
      {/* Floating "Cargar viaje" — siempre visible mientras navegan, no
          se pierde al hacer scroll. Solo authed users. */}
      {authedUsername && (
        <Link
          href="/trip/new"
          className="fixed bottom-6 right-4 z-50 flex items-center gap-2 bg-foreground px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-background shadow-lg transition-colors hover:bg-foreground/80 md:right-8"
          data-tour="upload"
          style={{
            bottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <Plus className="h-3 w-3" />
          Cargar viaje
        </Link>
      )}

      {/* SECTION 1 — Map hero. 100dvh con todo el UI flotante. El usuario
          ve esto primero; abajo aparecen las secciones de stats con scroll. */}
      <section className="relative h-[100dvh] w-full overflow-hidden">
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
          cityPins={cityPins}
          bolg100Pins={bolg100Status}
          selectedCityId={selectedCityId}
          selectedCountry={selectedCountry}
          onCountryClick={handleCountryClick}
          onCityClick={handleCityClick}
        />
      </div>

      {/* Scroll hint — solo en mobile, indica que hay más abajo. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center sm:bottom-6">
        <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-foreground/45 animate-bounce">
          ↓ Desliza para ver tu progreso
        </span>
      </div>

      {/* Anonymous hero hook — manifesto card. En mobile va anclado arriba
          (top-[110px]) para no chocar con el bottom panel; en sm+ va centrado.
          El wrapper usa box-border + px-4 simétrico y el card se auto-centra
          con mx-auto + w-full + max-w-md (clampea bien a 375px). */}
      {!authedUsername && !heroDismissed && (
        <div className="pointer-events-none absolute inset-x-0 top-[110px] z-20 box-border flex justify-center px-4 sm:inset-0 sm:top-0 sm:items-center">
          <div className="pointer-events-auto mx-auto flex w-full min-w-0 max-w-md flex-col gap-3 border-2 border-foreground bg-card/95 p-4 backdrop-blur-md sm:gap-4 sm:p-6 md:p-8">
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
            <h2 className="font-display text-2xl font-black leading-[1.02] tracking-tight sm:text-3xl md:text-4xl">
              Conquista el mundo con tu BØLG.
            </h2>
            <p className="text-xs leading-relaxed text-foreground/70 sm:text-sm">
              Cada ciudad tiene un conquistador. El primero que llega con un
              BØLG queda con su nombre clavado hasta que lo destronen. Cada mes
              el #1 del ranking se lleva un parche edición limitada, $100.000
              CLP y la portada de RRSS.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/login"
                className="group flex flex-1 items-center justify-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.32em] text-background transition-colors hover:bg-foreground/80 sm:py-4"
              >
                Súmate a conquistar
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={() => setHeroDismissed(true)}
                className="px-5 py-3 text-[10px] uppercase tracking-[0.32em] text-foreground/55 transition-colors hover:text-foreground sm:py-4"
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
          cities={citiesByCountry.get(selectedCountry) ?? []}
          onClose={() => setSelectedCountry(null)}
          onCityClick={(id) => {
            setSelectedCountry(null);
            setSelectedCityId(id);
          }}
          showInvite={!authedUsername}
        />
      )}

      {/* City pin panel */}
      {selectedCity && (
        <CityPanel
          city={selectedCity}
          flag={countryFlag(selectedCity.countryCode)}
          countryName={countryDisplayName(selectedCity.countryCode)}
          onClose={() => setSelectedCityId(null)}
          showInvite={!authedUsername}
        />
      )}
      </section>

      {/* SECTION 2 — Mode toggle (solo authed) + BØLG-100 progress */}
      <section className="border-t border-border px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {authedUsername && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
                Viendo
              </span>
              <div className="flex gap-1 border border-border p-1">
                <ModeButton active={mode === "global"} onClick={() => setMode("global")}>
                  Global
                </ModeButton>
                <ModeButton active={mode === "personal"} onClick={() => setMode("personal")}>
                  Personal
                </ModeButton>
              </div>
            </div>
          )}
          <Bolg100Progress
            hit={kpis.bolg100Hit}
            total={totals.bolg100}
          />
        </div>
      </section>

      {/* SECTION 3 — KPIs grid */}
      <section
        className="border-t border-border px-4 py-8 md:px-8 md:py-10"
        data-tour="kpis"
      >
        <div className="mx-auto w-full max-w-3xl">
          <span className="block text-[10px] uppercase tracking-[0.32em] text-foreground/45">
            Métricas
          </span>
          <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            <Kpi value={kpis.totalKm} label="Km" />
            <Kpi value={kpis.citiesVisited} label="Ciudades" />
            <Kpi value={kpis.countriesRecorridos} total={totals.countries} label="Países" />
            <Kpi value={kpis.continentsConocidos} total={totals.continents} label="Continentes" />
          </div>
        </div>
      </section>

      {/* SECTION 4 — Top travelers */}
      {topTravelers.length > 0 && (
        <section
          className="border-t border-border px-4 py-8 md:px-8 md:py-10"
          data-tour="top"
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
                Top conquistadores
              </span>
              <Link
                href="/ranking"
                className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 transition-colors hover:text-foreground"
              >
                Ver ranking →
              </Link>
            </div>
            <ul className="flex flex-col gap-2">
              {topTravelers.map((t, idx) => (
                <li key={t.id}>
                  <Link
                    href={`/u/${t.username}`}
                    className="group flex items-center gap-4 border border-border bg-card/40 px-3 py-3 transition-colors hover:bg-card/80 md:px-4"
                  >
                    <span className="w-6 shrink-0 font-display text-base font-black tabular-nums text-foreground/55 md:text-lg">
                      #{idx + 1}
                    </span>
                    <Avatar className="h-9 w-9 shrink-0 bg-fog md:h-10 md:w-10">
                      {t.avatarUrl && (
                        <AvatarImage src={t.avatarUrl} alt={t.displayName ?? t.username} />
                      )}
                      <AvatarFallback className="bg-fog text-[10px] font-black text-foreground/75">
                        {initialsFrom(t.displayName ?? t.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm">
                        {t.displayName ?? `@${t.username}`}
                      </span>
                      <span className="truncate font-mono text-[10px] tabular-nums text-foreground/55">
                        {Math.round(t.totalKm).toLocaleString("es-CL")} km
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* SECTION 5 — Country chips. Drill-down: clic en chip auto-scroll
          al mapa y abre el CountryPanel. */}
      <section className="border-t border-border px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <span className="block text-[10px] uppercase tracking-[0.32em] text-foreground/45">
            Países conquistados
          </span>
          {countryChips.length > 0 ? (
            <div className="-mx-4 mt-4 overflow-x-auto px-4 md:-mx-8 md:px-8">
              <div className="flex min-w-min items-center gap-2">
                {countryChips.map((c) => {
                  const active = c.code === selectedCountry;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        handleCountryClick(c.code);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
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
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/50">
              Sin viajes registrados todavía. Sé el primer conquistador.
            </p>
          )}
        </div>
      </section>

      {/* SECTION 6 — CTA "Hazte parte" solo para anónimos */}
      {!authedUsername && (
        <section
          className="border-t border-border px-4 py-10 md:px-8 md:py-14"
          data-tour="join"
        >
          <div className="mx-auto w-full max-w-3xl">
            <Link
              href="/login"
              className="group flex items-center justify-center gap-2 border-2 border-foreground bg-foreground/[0.04] px-6 py-5 text-center text-[10px] uppercase tracking-[0.32em] text-foreground transition-colors hover:bg-foreground/10"
            >
              Hazte parte de la comunidad
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Footer minimal */}
      <footer
        className="border-t border-border px-4 py-8 md:px-8"
        style={{
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2">
          <BolgWordmark href="/" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40">
            Atlas BØLG · Cada viaje cuenta
          </span>
        </div>
      </footer>
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
            <LegendDot color="#5bc0be" label="Ciudad con BØLG" />
            <LegendDot color="#7a7770" label="Visita sin BØLG" />
            <LegendRow color="#dcd8d0" label="Sin conquistar" />
          </ul>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="h-3 w-3 rounded-full border border-foreground/40"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="font-mono text-[10px] text-foreground/65">{label}</span>
    </li>
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

function Bolg100Progress({ hit, total }: { hit: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (hit / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2 px-4 py-3 md:px-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.32em] text-ember">
          ★ Destinos BØLG · Curados
        </span>
        <span className="font-display text-base font-black tabular-nums tracking-tight md:text-lg">
          <span className="text-foreground">{hit}</span>
          <span className="text-foreground/40"> / {total}</span>
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden bg-foreground/[0.08]">
        <div
          className="absolute inset-y-0 left-0 bg-ember transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] leading-snug text-foreground/55">
        Los 100 lugares del mundo que importan según BØLG. Outdoor, cultura,
        rincones escondidos. El que llegue primero a un destino con un BØLG
        queda con su nombre clavado ahí.
      </p>
    </div>
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
  cities,
  onClose,
  onCityClick,
  showInvite,
}: {
  name: string;
  flag: string;
  continent: string;
  status: CountryStatus;
  cities: ConqueredCity[];
  onClose: () => void;
  onCityClick: (cityId: string) => void;
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
        "absolute z-40 flex flex-col gap-0 border border-border bg-card/95 backdrop-blur-md",
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

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {cities.length === 0 ? (
          <p className="font-mono text-xs leading-relaxed text-foreground/65">
            {`Nadie ha registrado viajes en ${name} todavía. El primero en cargar uno se convierte en su conquistador.`}
          </p>
        ) : (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
              Ciudades conquistadas
            </p>
            <ul className="flex flex-col divide-y divide-border/60">
              {cities.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onCityClick(c.id)}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.04]"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13px] font-medium">
                        {c.name}
                      </span>
                      {c.conquerorUsername ? (
                        <span className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
                          @{c.conquerorUsername}
                        </span>
                      ) : (
                        <span className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                          Conquistador anónimo
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em]",
                        c.bolgVisible
                          ? "bg-aurora/15 text-aurora"
                          : "bg-foreground/[0.06] text-foreground/55",
                      )}
                    >
                      {c.bolgVisible ? "BØLG" : "Visita"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
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

function CityPanel({
  city,
  flag,
  countryName,
  onClose,
  showInvite,
}: {
  city: ConqueredCity;
  flag: string;
  countryName: string;
  onClose: () => void;
  showInvite: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute z-40 flex flex-col gap-0 border border-border bg-card/95 backdrop-blur-md",
        "md:right-6 md:top-[180px] md:w-[340px] md:max-w-[40vw]",
        "inset-x-3 top-[180px] md:inset-auto",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-foreground/55">
            <span className="text-base leading-none">{flag}</span>
            {countryName}
          </span>
          <h2 className="font-display text-2xl font-black leading-tight tracking-tight">
            {city.name}
          </h2>
          <span
            className={cn(
              "mt-1 inline-flex w-fit items-center gap-1.5 border px-2 py-1 text-[10px] uppercase tracking-[0.28em]",
              city.bolgVisible
                ? "border-aurora text-aurora"
                : "border-foreground/40 text-foreground/65",
            )}
          >
            {city.bolgVisible ? "Conquista BØLG" : "Visita registrada"}
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

      <div className="flex flex-col gap-3 px-4 py-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
          Conquistador actual
        </span>
        {city.conquerorUsername ? (
          <Link
            href={`/u/${city.conquerorUsername}`}
            className="group flex items-center gap-3 border border-border bg-card/60 px-3 py-2.5 transition-colors hover:bg-foreground/[0.04]"
          >
            <Avatar className="h-9 w-9 bg-fog">
              {city.conquerorAvatarUrl && (
                <AvatarImage
                  src={city.conquerorAvatarUrl}
                  alt={city.conquerorDisplayName ?? city.conquerorUsername}
                />
              )}
              <AvatarFallback className="bg-fog text-[10px] font-black text-foreground/75">
                {initialsFrom(
                  city.conquerorDisplayName ?? city.conquerorUsername,
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[13px] font-medium">
                {city.conquerorDisplayName ?? `@${city.conquerorUsername}`}
              </span>
              <span className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
                @{city.conquerorUsername}
              </span>
            </div>
            <ArrowRight className="h-3 w-3 shrink-0 text-foreground/40 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <p className="font-mono text-xs leading-relaxed text-foreground/65">
            Conquistador anónimo. Sé tú el que destrone esta ciudad con un BØLG
            visible.
          </p>
        )}

        <p className="font-mono text-[11px] leading-relaxed text-foreground/60">
          {city.bolgVisible
            ? "Esta ciudad la marca un viaje con BØLG visible. Para destronarla necesitas subir tu propio viaje con BØLG antes que nadie más."
            : "Aún no hay un viaje BØLG en esta ciudad. El primero que suba uno se la lleva."}
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
