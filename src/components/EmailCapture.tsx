"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    // Sin backend en Sesión 1 — el wire-up real (Supabase) llega en Sesión 2.
    console.log("[atlas:waitlist]", email);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p
        id="waitlist"
        className="font-mono text-sm leading-relaxed text-foreground/70"
      >
        Anotado. Te avisamos cuando lancemos.
      </p>
    );
  }

  return (
    <form
      id="waitlist"
      onSubmit={onSubmit}
      className="flex w-full max-w-md items-stretch gap-3"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.cl"
        aria-label="Correo electrónico"
        className="flex-1 border-b border-border bg-transparent px-1 py-3 text-base placeholder:text-foreground/30 focus:border-foreground focus:outline-none transition-colors"
      />
      <button
        type="submit"
        className="flex items-center gap-2 border-b border-border px-2 py-3 text-[10px] uppercase tracking-[0.28em] text-foreground/70 hover:border-foreground hover:text-foreground transition-colors"
      >
        Súmate
        <ArrowRight className="h-3 w-3" aria-hidden />
      </button>
    </form>
  );
}
