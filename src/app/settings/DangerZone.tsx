"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  deleteAccount,
  type DeleteAccountState,
} from "./delete-account";

const INITIAL_STATE: DeleteAccountState = { status: "idle" };

type Props = {
  username: string;
};

export function DangerZone({ username }: Props) {
  const [state, formAction, isPending] = useActionState(
    deleteAccount,
    INITIAL_STATE,
  );
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  // Si el form falla con error, mantenemos el dialog abierto para que el
  // usuario corrija. Si se cierra, limpiamos el input.
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  // Bloquear scroll del body mientras el dialog está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const matches = typed.trim().toLowerCase().replace(/^@/, "") === username;

  return (
    <section className="flex flex-col gap-4 border border-destructive/60 bg-destructive/[0.03] p-5 md:p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" aria-hidden />
        <h2 className="text-[10px] uppercase tracking-[0.32em] text-destructive">
          Zona peligrosa · Eliminar cuenta
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-foreground/70">
        Esto borra permanentemente tu perfil, viajes, ciudades conquistadas y
        equipaje. No es reversible. Quedan 30 días de buffer si te
        arrepientes, contáctanos a{" "}
        <a
          href="mailto:hola@bolg.cl"
          className="underline underline-offset-4 hover:text-foreground"
        >
          hola@bolg.cl
        </a>
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start border border-destructive bg-destructive px-4 py-2.5 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-destructive/90 transition-colors"
      >
        Eliminar mi cuenta
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setOpen(false);
          }}
        >
          <div className="relative w-full max-w-md border border-destructive bg-background p-6 md:p-8">
            <button
              type="button"
              onClick={() => !isPending && setOpen(false)}
              className="absolute right-3 top-3 p-2 text-foreground/40 hover:text-foreground transition-colors disabled:opacity-30"
              disabled={isPending}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className="h-3.5 w-3.5 text-destructive"
                  aria-hidden
                />
                <h3
                  id="delete-dialog-title"
                  className="text-[10px] uppercase tracking-[0.32em] text-destructive"
                >
                  Confirmar eliminación
                </h3>
              </div>

              <p className="text-sm leading-relaxed text-foreground/70">
                Escribe tu username{" "}
                <span className="font-mono text-foreground">@{username}</span>{" "}
                para confirmar.
              </p>

              <form action={formAction} className="flex flex-col gap-4">
                <input
                  type="text"
                  name="confirm_username"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={username}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={isPending}
                  className="w-full border-b border-border bg-transparent py-3 font-mono text-base placeholder:text-foreground/30 focus:border-destructive focus:outline-none transition-colors disabled:opacity-50"
                  // biome-ignore lint/a11y/noAutofocus: dialog
                  autoFocus
                />

                {state.status === "error" && (
                  <p className="font-mono text-xs text-destructive">
                    {state.message}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                    className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors disabled:opacity-30"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!matches || isPending}
                    className={cn(
                      "flex items-center gap-2 border border-destructive bg-destructive px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background transition-colors",
                      matches && !isPending
                        ? "hover:bg-destructive/90"
                        : "opacity-30 cursor-not-allowed",
                    )}
                  >
                    {isPending ? (
                      <>
                        Eliminando
                        <Loader2
                          className="h-3 w-3 animate-spin"
                          aria-hidden
                        />
                      </>
                    ) : (
                      "Eliminar definitivamente"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
