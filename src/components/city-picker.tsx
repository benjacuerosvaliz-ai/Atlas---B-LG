"use client";

import { Loader2, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchCities, type City } from "@/lib/mapbox";

type Props = {
  value: City | undefined;
  onChange: (city: City | undefined) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  /** Sugerencia rápida (ej. la ciudad del perfil). */
  suggestion?: string | null;
  autoFocus?: boolean;
};

/**
 * Picker de ciudad estructurada para el form de "Cargar viaje" del v2.
 * Llama a Mapbox `types=place` para que solo devuelva ciudades (no
 * direcciones ni POIs). Debounced ~280ms.
 */
export function CityPicker({
  value,
  onChange,
  label,
  placeholder = "Busca tu ciudad...",
  required,
  suggestion,
  autoFocus,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPickingSuggestion, setIsPickingSuggestion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || value) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const cities = await searchCities(query, controller.signal);
        setResults(cities);
        setIsOpen(true);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("[city-picker]", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(city: City) {
    onChange(city);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function clear() {
    onChange(undefined);
    setQuery("");
  }

  async function pickSuggestion() {
    if (!suggestion || isPickingSuggestion) return;
    setIsPickingSuggestion(true);
    try {
      const cities = await searchCities(suggestion);
      const first = cities[0];
      if (first) pick(first);
      else setQuery(suggestion);
    } catch (err) {
      console.error("[city-picker] suggestion", err);
      setQuery(suggestion);
    } finally {
      setIsPickingSuggestion(false);
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>

      {value ? (
        <div className="flex min-h-[44px] items-center justify-between gap-3 border-b border-foreground py-3">
          <div className="flex min-w-0 items-center gap-3">
            <MapPin
              className="h-4 w-4 shrink-0 text-foreground/60"
              aria-hidden
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base">{value.name}</span>
              <span className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                {value.country}
                {value.placeFormatted && value.placeFormatted !== value.name && (
                  <> · {value.placeFormatted}</>
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="grid h-11 w-11 shrink-0 place-items-center text-foreground/40 transition-colors hover:text-foreground sm:h-8 sm:w-8"
            aria-label="Cambiar ciudad"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-[44px] w-full border-b border-border bg-transparent py-3 pr-8 text-base placeholder:text-foreground/30 focus:border-foreground focus:outline-none transition-colors"
          />
          {isLoading && (
            <Loader2 className="absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-foreground/40" />
          )}

          {isOpen && results.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[min(60vh,18rem)] overflow-y-auto overscroll-contain border border-border bg-card shadow-lg">
              {results.map((c) => (
                <li key={c.mapboxId}>
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    className="flex min-h-[56px] w-full flex-col items-start justify-center gap-1 border-b border-border/40 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-foreground/[0.04]"
                  >
                    <span className="text-sm">{c.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                      {c.placeFormatted}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {suggestion && !query && (
            <button
              type="button"
              onClick={pickSuggestion}
              disabled={isPickingSuggestion}
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 border border-border px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-foreground/70 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
            >
              {isPickingSuggestion ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              ) : (
                <MapPin className="h-3 w-3" aria-hidden />
              )}
              Usar {suggestion}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
