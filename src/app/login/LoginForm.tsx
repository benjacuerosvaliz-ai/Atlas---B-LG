"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const INITIAL_STATE: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    sendMagicLink,
    INITIAL_STATE,
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
          autoFocus
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
    </form>
  );
}
