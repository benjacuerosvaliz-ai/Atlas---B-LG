"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import {
  sendMagicLink,
  signInWithPin,
  type LoginState,
  type PinLoginState,
} from "./actions";

const MAGIC_INITIAL: LoginState = { status: "idle" };
const PIN_INITIAL: PinLoginState = { status: "idle" };

type Tab = "pin" | "magic";

export function LoginForm() {
  // PIN default — once a user has done first-login they live here. The
  // magic-link tab stays one click away for first-timers + recovery.
  const [tab, setTab] = useState<Tab>("pin");

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Método de acceso"
        className="grid grid-cols-2 border border-border"
      >
        <TabButton
          active={tab === "pin"}
          onClick={() => setTab("pin")}
          label="Usuario + PIN"
          sub="Rápido"
        />
        <TabButton
          active={tab === "magic"}
          onClick={() => setTab("magic")}
          label="Magic link"
          sub="Por correo"
        />
      </div>

      {tab === "pin" ? <PinForm /> : <MagicForm />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-transparent text-foreground/65 hover:text-foreground",
      )}
    >
      <span className="text-[11px] uppercase tracking-[0.24em]">{label}</span>
      <span
        className={cn(
          "font-mono text-[9px] uppercase tracking-[0.22em]",
          active ? "text-background/70" : "text-foreground/40",
        )}
      >
        {sub}
      </span>
    </button>
  );
}

function PinForm() {
  const [state, formAction, isPending] = useActionState(
    signInWithPin,
    PIN_INITIAL,
  );
  const [pin, setPin] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          Usuario
        </label>
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          autoFocus
          placeholder="benja"
          disabled={isPending}
          className="border-b border-border bg-transparent px-1 py-3 text-base placeholder:text-foreground/30 focus:border-foreground focus:outline-none transition-colors disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          PIN (4 dígitos)
        </label>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          required
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          autoComplete="current-password"
          placeholder="••••"
          disabled={isPending}
          className="border-b border-border bg-transparent px-1 py-3 text-center font-mono text-base tracking-[0.5em] placeholder:text-foreground/30 focus:border-foreground focus:outline-none transition-colors disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || pin.length !== 4}
        className="flex items-center justify-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors disabled:opacity-30"
      >
        {isPending ? (
          <>
            Entrando
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          </>
        ) : (
          <>
            Entrar
            <ArrowRight className="h-3 w-3" aria-hidden />
          </>
        )}
      </button>

      {state.status === "error" && (
        <p
          role="alert"
          className="border-l-2 border-destructive bg-destructive/[0.06] px-3 py-2 font-mono text-xs leading-relaxed text-destructive"
        >
          {state.message}
        </p>
      )}

      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45">
        ¿Olvidaste tu PIN? Entra con magic link y cámbialo desde tu perfil.
      </p>
    </form>
  );
}

function MagicForm() {
  const [state, formAction, isPending] = useActionState(
    sendMagicLink,
    MAGIC_INITIAL,
  );

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/40">
          Enlace enviado
        </span>
        <p className="font-mono text-sm leading-relaxed text-foreground/80">
          Revisa{" "}
          <span className="text-foreground">{state.email}</span>. El enlace caduca en 1 hora.
        </p>
        <p className="font-mono text-xs leading-relaxed text-foreground/45">
          ¿No te llegó? Revisa spam o reintenta en unos segundos.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex items-stretch gap-3">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.cl"
          aria-label="Correo electrónico"
          disabled={isPending}
          className="flex-1 border-b border-border bg-transparent px-1 py-3 text-base placeholder:text-foreground/30 focus:border-foreground focus:outline-none transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 border-b border-border px-2 py-3 text-[10px] uppercase tracking-[0.28em] text-foreground/70 hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground/70"
        >
          {isPending ? (
            <>
              Enviando
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            </>
          ) : (
            <>
              Enviar
              <ArrowRight className="h-3 w-3" aria-hidden />
            </>
          )}
        </button>
      </div>
      {state.status === "error" && (
        <p className="font-mono text-xs text-destructive">{state.message}</p>
      )}
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45">
        Si es tu primera vez, te creamos la cuenta automáticamente.
      </p>
    </form>
  );
}
