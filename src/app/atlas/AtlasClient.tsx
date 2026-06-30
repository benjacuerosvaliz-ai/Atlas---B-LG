"use client";

import { ArrowRight, ExternalLink, MapPin, Plus, Sparkles, Trophy, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivityTicker } from "@/components/activity-ticker";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { FirstVisitToast } from "@/components/first-visit-toast";
import { MonthlyPrizeChip } from "@/components/monthly-prize-chip";
import { Bolg100Panel } from "@/components/bolg100-panel";
import { OnboardingTour } from "@/components/onboarding-tour";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CONTINENT_NAMES, COUNTRY_TO_CONTINENT, type ContinentCode } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { buildEscapeUrl, isInAppBrowser } from "@/lib/webview";
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
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>("global");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedBolg100Id, setSelectedBolg100Id] = useState<string | null>(null);

  // WebView / in-app browser detection — IG/WA/FB/etc. cargan topojson
  // externos con menos confiabilidad. Detectamos client-side y mostramos
  // un banner suave invitando a abrir en navegador. NO bloquea el mapa.
  const [webview, setWebview] = useState<{ on: boolean; escapeUrl: string | null }>(
    { on: false, escapeUrl: null },
  );
  const [webviewBannerDismissed, setWebviewBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent;
    if (!isInAppBrowser(ua)) return;
    setWebview({
      on: true,
      escapeUrl: buildEscapeUrl(window.location.href, ua),
    });
  }, []);

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

  // Social proof: cuántas conquistas hoy / cuántos conquistadores activos
  // (calculado de los props que ya tenemos, sin nuevos fetchs).
  const now = new Date();
  const todayUtc = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  const conquestsToday = useMemo(
    () => recentActivity.filter((e) => e.at.startsWith(todayUtc)).length,
    [recentActivity, todayUtc],
  );
  const uniqueRecentConquerors = useMemo(
    () => new Set(recentActivity.map((e) => e.username)).size,
    [recentActivity],
  );

  // Urgencia del premio mensual: cuántos días quedan para que se entregue.
  const daysLeftInMonth = useMemo(() => {
    const lastDay = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getUTCDate();
    return Math.max(0, lastDay - now.getUTCDate());
  }, [now]);

  const selectedCountryName = selectedCountry
    ? countryDisplayName(selectedCountry)
    : null;

  const selectedCity = selectedCityId ? cityById.get(selectedCityId) ?? null : null;
  const selectedBolg100 = useMemo(
    () =>
      selectedBolg100Id
        ? bolg100Status.find((d) => d.id === selectedBolg100Id) ?? null
        : null,
    [selectedBolg100Id, bolg100Status],
  );

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

      {/* Header — normal flow (no más absolute sobre el mapa) */}
      <header
        className="relative z-30 flex items-center justify-between gap-3 px-4 py-4 md:px-8 md:py-5"
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

      {/* WebView banner — sutil, sobre el KPI. Solo si detectamos in-app
          browser (IG/WA/FB/etc.) y el user aún no lo cerró. */}
      {webview.on && !webviewBannerDismissed && (
        <WebViewBanner
          escapeUrl={webview.escapeUrl}
          onDismiss={() => setWebviewBannerDismissed(true)}
        />
      )}

      {/* KPI BANNER — arriba del mapa. Es lo primero que ve el usuario:
          cuánto kilometraje + cuántas ciudades / países / continentes
          conquistados.  Mobile 4 cols (compactas), desktop 4 cols grandes. */}
      <section
        className="relative z-30 border-y border-border bg-card/40 px-4 py-3 md:px-8 md:py-4"
        data-tour="kpis"
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid grid-cols-4 gap-2 md:gap-6">
            <Kpi value={kpis.totalKm} label="Km" />
            <Kpi value={kpis.citiesVisited} label="Ciudades" />
            <Kpi value={kpis.countriesRecorridos} total={totals.countries} label="Países" />
            <Kpi
              value={kpis.continentsConocidos}
              total={totals.continents}
              label="Continentes"
            />
          </div>
          {(conquestsToday > 0 || uniqueRecentConquerors > 0 || daysLeftInMonth > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-border/60 pt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-foreground/55 md:mt-3 md:pt-3 md:text-[10px]">
              {conquestsToday > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aurora" />
                  Hoy · <span className="tabular-nums text-foreground">{conquestsToday}</span>{" "}
                  {conquestsToday === 1 ? "conquista" : "conquistas"}
                </span>
              )}
              {uniqueRecentConquerors > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5">
                  Esta semana ·{" "}
                  <span className="tabular-nums text-foreground">
                    {uniqueRecentConquerors}
                  </span>{" "}
                  {uniqueRecentConquerors === 1 ? "conquistador" : "conquistadores"}
                </span>
              )}
              {daysLeftInMonth > 0 && (
                <span className="inline-flex items-center gap-1.5 text-ember">
                  Premio del mes en{" "}
                  <span className="tabular-nums">{daysLeftInMonth}</span>{" "}
                  {daysLeftInMonth === 1 ? "día" : "días"}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 1 — Map hero. Altura calculada: 100dvh - header - banner.
          El mapa sigue siendo el protagonista pero el banner queda visible
          arriba siempre que estés en este fold. */}
      <section className="relative h-[calc(100dvh-200px)] w-full overflow-hidden md:h-[calc(100dvh-220px)]">
      {/* Live activity ticker + monthly prize chip — sobre el mapa */}
      <div className="pointer-events-none absolute inset-x-0 top-2 z-[25] flex items-center justify-between gap-2 px-4 md:px-8">
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
          onBolg100Click={(id) => {
            setSelectedCountry(null);
            setSelectedCityId(null);
            setSelectedBolg100Id(id);
          }}
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

      {/* Anonymous hero hook — sutil, no tapa el mapa.
          Mobile: chip anclado bottom (sobre el scroll hint) que se expande
          al tocar. El usuario ve el mapa primero y decide explorar.
          Desktop: chip flotante top-right discreto.
          Estado: collapsed por defecto, expandido al click. */}
      {!authedUsername && !heroDismissed && (
        <AnonymousHook
          expanded={heroExpanded}
          onExpand={() => setHeroExpanded(true)}
          onCollapse={() => setHeroExpanded(false)}
          onDismiss={() => setHeroDismissed(true)}
        />
      )}

      {/* Onboarding tour */}
      <OnboardingTour authedUsername={authedUsername} />

      {/* Toast de "primera vez" — solo si NO es WebView (evitar overload). */}
      {!webview.on && <FirstVisitToast authedUsername={authedUsername} />}

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

      {/* BØLG-100 destination panel (click sobre un ghost pin) */}
      {selectedBolg100 && (
        <Bolg100Panel
          destination={selectedBolg100}
          onClose={() => setSelectedBolg100Id(null)}
          authedUsername={authedUsername}
        />
      )}
      </section>

      {/* SECTION 2 — Países conquistados. JUSTO debajo del mapa. Tarjetas
          con bandera grande para que se reconozca a primera vista. */}
      <section className="border-t border-border bg-card/30 px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/55">
              Países conquistados
            </span>
            {authedUsername && (
              <div className="flex gap-1 border border-border p-1">
                <ModeButton active={mode === "global"} onClick={() => setMode("global")}>
                  Global
                </ModeButton>
                <ModeButton active={mode === "personal"} onClick={() => setMode("personal")}>
                  Personal
                </ModeButton>
              </div>
            )}
          </div>
          {countryChips.length > 0 ? (
            <div className="-mx-4 mt-5 overflow-x-auto px-4 md:-mx-8 md:px-8">
              <div className="flex min-w-min items-stretch gap-3">
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
                        "group flex shrink-0 flex-col items-center justify-center gap-1.5 border-2 px-4 py-3 transition-colors md:px-6 md:py-4",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : c.status === "complete"
                            ? "border-aurora/60 bg-card hover:border-aurora"
                            : "border-border bg-card hover:border-foreground/60",
                      )}
                    >
                      <span className="text-3xl leading-none md:text-4xl">
                        {countryFlag(c.code)}
                      </span>
                      <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.24em]">
                        {countryDisplayName(c.code)}
                      </span>
                      {c.status === "complete" && (
                        <span
                          className={cn(
                            "font-mono text-[9px]",
                            active ? "text-background/70" : "text-aurora",
                          )}
                        >
                          ✓ Conquistado
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

      {/* SECTION 3 — BØLG-100 progress */}
      <section className="border-t border-border px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <Bolg100Progress
            hit={kpis.bolg100Hit}
            total={totals.bolg100}
          />
        </div>
      </section>

      {/* SECTION 4 — Top conquistadores. Avatares grandes con foto real,
          card prominente. Scrolleable abajo del mapa, foto de perfil
          dominante (request explícito del founder). */}
      {topTravelers.length > 0 && (
        <section
          className="border-t border-border px-4 py-8 md:px-8 md:py-12"
          data-tour="top"
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-6 flex items-baseline justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/55">
                Top conquistadores
              </span>
              <Link
                href="/ranking"
                className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 transition-colors hover:text-foreground"
              >
                Ver ranking completo →
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {topTravelers.map((t, idx) => (
                <li key={t.id}>
                  <Link
                    href={`/u/${t.username}`}
                    className="group flex flex-col items-center gap-3 border border-border bg-card/60 p-5 transition-colors hover:border-foreground/70 hover:bg-card md:p-6"
                  >
                    <span
                      className={cn(
                        "font-display text-lg font-black tabular-nums md:text-xl",
                        idx === 0
                          ? "text-aurora"
                          : idx === 1
                            ? "text-ember"
                            : "text-foreground/55",
                      )}
                    >
                      #{idx + 1}
                    </span>
                    <Avatar className="h-20 w-20 shrink-0 bg-fog md:h-24 md:w-24">
                      {t.avatarUrl && (
                        <AvatarImage
                          src={t.avatarUrl}
                          alt={t.displayName ?? t.username}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-fog text-base font-black text-foreground/75 md:text-lg">
                        {initialsFrom(t.displayName ?? t.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex w-full min-w-0 flex-col items-center gap-0.5 text-center">
                      <span className="line-clamp-1 text-sm font-medium">
                        {t.displayName ?? `@${t.username}`}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-foreground/55">
                        @{t.username}
                      </span>
                      <span className="mt-1 font-display text-base font-black tabular-nums tracking-tight md:text-lg">
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

      {/* SECTION 6 — CTA brutal "Tu nombre puede estar en este mapa" */}
      {!authedUsername && (
        <section
          className="relative border-t border-border bg-foreground px-4 py-12 text-background md:px-8 md:py-20"
          data-tour="join"
          aria-label="Invitación a sumarte al Atlas BØLG"
        >
          {/* Patrón sutil para que respire */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 12px)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 md:gap-10">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-[0.36em] text-aurora">
                Atlas BØLG · Anónimo
              </span>
              <h2 className="font-display text-3xl font-black leading-[1.02] tracking-tight sm:text-4xl md:text-5xl">
                Tu nombre puede estar
                <br />
                en este mapa.
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-background/70 md:text-base">
                Súmate gratis. La primera ciudad que subas con un BØLG queda
                marcada con tu nombre hasta que alguien te destrone.
              </p>
            </div>

            {/* 3 razones icónicas */}
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ReasonCard
                icon={<MapPin className="h-4 w-4" />}
                title="Conquista"
                copy="Sube un viaje y la ciudad lleva tu nombre."
              />
              <ReasonCard
                icon={<Trophy className="h-4 w-4" />}
                title={
                  daysLeftInMonth > 0
                    ? `Premio en ${daysLeftInMonth} ${daysLeftInMonth === 1 ? "día" : "días"}`
                    : "Premio del mes"
                }
                copy="$100.000 + parche edición limitada al #1."
              />
              <ReasonCard
                icon={<Sparkles className="h-4 w-4" />}
                title="Comunidad"
                copy={
                  uniqueRecentConquerors > 0
                    ? `${uniqueRecentConquerors} conquistadores activos esta semana.`
                    : "Conquistadores activos cada semana."
                }
              />
            </ul>

            {/* Mini-preview del perfil */}
            <div className="border border-background/20 bg-background/[0.04] p-4 md:p-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-background/55">
                Así se verá tu perfil
              </span>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center border border-background/30 bg-background/10 font-display text-sm font-black text-background/70">
                  TÚ
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">@tu_username</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-background/55">
                    0 km · 0 ciudades · #— ranking
                  </span>
                </div>
                <span className="hidden font-mono text-[9px] uppercase tracking-[0.28em] text-aurora sm:inline">
                  Pendiente conquista
                </span>
              </div>
            </div>

            {/* CTA gigante */}
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="group flex items-center justify-center gap-3 bg-aurora px-6 py-5 text-center text-[11px] font-medium uppercase tracking-[0.32em] text-foreground transition-colors hover:bg-aurora/85 md:py-6 md:text-[13px]"
              >
                Crear cuenta gratis · 30 segundos
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className="text-center font-mono text-[10px] uppercase tracking-[0.28em] text-background/45">
                Sin tarjeta · Sin spam · Conquistar mi primera ciudad
              </span>
            </div>
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
    <div className="pointer-events-none absolute left-4 top-12 z-20 md:left-8 md:top-14">
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
          Súmate al Atlas · Gratis
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
          Súmate al Atlas · Gratis
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function AnonymousHook({
  expanded,
  onExpand,
  onCollapse,
  onDismiss,
}: {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onDismiss: () => void;
}) {
  if (!expanded) {
    // Estado colapsado: chip discreto que NO tapa el mapa.
    // Mobile: bottom-anchored, sobre el scroll hint. Desktop: top-right.
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-12 z-[25] flex justify-center px-4 sm:bottom-auto sm:left-auto sm:right-6 sm:top-12 sm:justify-end sm:px-0">
        <button
          type="button"
          onClick={onExpand}
          className="pointer-events-auto group flex items-center gap-2 border border-foreground/30 bg-card/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/75 shadow-lg backdrop-blur-md transition-all hover:border-foreground hover:text-foreground"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aurora" />
          <span>Conquistar mi primera ciudad</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    );
  }

  // Estado expandido: card con backdrop-blur fuerte y opacidad alta
  // para que sea legible pero el mapa siga visible detrás.
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[110px] z-20 box-border flex justify-center px-4 sm:inset-0 sm:top-0 sm:items-center">
      <div className="pointer-events-auto mx-auto flex w-full min-w-0 max-w-md flex-col gap-3 border-2 border-foreground bg-card/[0.96] p-4 shadow-2xl backdrop-blur-xl sm:gap-4 sm:p-6 md:p-8">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.36em] text-aurora">
            Atlas BØLG
          </span>
          <button
            type="button"
            onClick={onCollapse}
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
          Cada ciudad tiene un conquistador. El primero que llega con un BØLG
          queda con su nombre clavado hasta que lo destronen. Cada mes el #1
          se lleva un parche edición limitada, $100.000 CLP y la portada de
          RRSS.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Link
            href="/login"
            className="group flex flex-1 items-center justify-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.32em] text-background transition-colors hover:bg-foreground/80 sm:py-4"
          >
            Crear cuenta gratis
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="border border-foreground/30 px-5 py-3 text-[10px] uppercase tracking-[0.32em] text-foreground transition-colors hover:border-foreground hover:bg-foreground/[0.05] sm:py-4"
          >
            Explorar el mapa
          </button>
        </div>
      </div>
    </div>
  );
}

function ReasonCard({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <li className="flex flex-col gap-2 border border-background/20 bg-background/[0.04] p-4">
      <span className="flex h-7 w-7 items-center justify-center border border-background/30 text-aurora">
        {icon}
      </span>
      <span className="text-[10px] uppercase tracking-[0.28em] text-background/80">
        {title}
      </span>
      <span className="text-xs leading-snug text-background/65">{copy}</span>
    </li>
  );
}

function WebViewBanner({
  escapeUrl,
  onDismiss,
}: {
  escapeUrl: string | null;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="relative z-30 flex items-center justify-between gap-3 border-y border-ember/40 bg-ember/[0.08] px-4 py-2 text-foreground/85 md:px-8"
    >
      <span className="flex-1 font-mono text-[10px] leading-snug tracking-[0.04em] sm:text-[11px]">
        Mejor experiencia en Safari o Chrome — toca aquí para abrir.
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {escapeUrl && (
          <a
            href={escapeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 border border-foreground/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.28em] text-foreground transition-colors hover:border-foreground hover:bg-foreground/[0.05]"
          >
            Abrir
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso de navegador"
          className="text-foreground/50 transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
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
