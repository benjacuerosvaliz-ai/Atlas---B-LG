"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function TripShareRow({
  shareUrl,
  destination,
}: {
  shareUrl: string;
  destination: string;
}) {
  const [copied, setCopied] = useState(false);
  const text = `Mira mi conquista en el Atlas BØLG: ${destination}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text} — ${shareUrl}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copia el link:", shareUrl);
    }
  }

  async function nativeShare() {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: `Atlas BØLG · ${destination}`, text, url: shareUrl });
    } catch {
      // user canceled
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
        Compartir
      </span>
      <div className="flex flex-wrap gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/70 transition-colors hover:border-foreground hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.768.967-.941 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
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
