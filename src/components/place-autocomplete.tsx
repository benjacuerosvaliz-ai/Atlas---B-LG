"use client";

import { Loader2, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchPlaces, type Place } from "@/lib/mapbox";

type Props = {
  value: Place | undefined;
  onChange: (place: Place | undefined) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
};

export function PlaceAutocomplete({
  value,
  onChange,
  label,
  placeholder = "Buscar lugar...",
  required,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search.
  useEffect(() => {
    if (!query || value) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const places = await searchPlaces(query, controller.signal);
        setResults(places);
        setIsOpen(true);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("[place-autocomplete]", err);
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

  // Close dropdown on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(place: Place) {
    onChange(place);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function clear() {
    onChange(undefined);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>

      {value ? (
        <div className="flex items-center justify-between gap-3 border-b border-foreground py-3">
          <div className="flex items-center gap-3 min-w-0">
            <MapPin className="h-4 w-4 shrink-0 text-foreground/60" aria-hidden />
            <div className="flex flex-col min-w-0">
              <span className="truncate text-base">{value.name}</span>
              <span className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                {value.placeFormatted}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-foreground/40 hover:text-foreground transition-colors"
            aria-label="Cambiar lugar"
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
            className="w-full border-b border-border bg-transparent py-3 pr-8 text-base placeholder:text-foreground/30 focus:border-foreground focus:outline-none transition-colors"
          />
          {isLoading && (
            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-foreground/40" />
          )}

          {isOpen && results.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-y-auto border border-border bg-card shadow-lg">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pick(p)}
                    className="flex w-full flex-col items-start gap-1 border-b border-border/40 px-4 py-3 text-left last:border-b-0 hover:bg-foreground/[0.04] transition-colors"
                  >
                    <span className="text-sm">{p.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                      {p.placeFormatted}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
