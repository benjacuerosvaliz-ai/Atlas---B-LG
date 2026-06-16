import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Ingresar",
  description:
    "Entra a BØLG Atlas con tu correo. Te enviamos un enlace de acceso, sin contraseñas.",
};

type Props = {
  searchParams: Promise<{ error?: string; detail?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error, detail } = await searchParams;
  const friendlyError = error ? translateAuthError(error, detail) : null;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="flex w-full max-w-md flex-col gap-10">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Ingresar
            </span>
            <h1 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
              Entra al Atlas.
            </h1>
            <p className="text-base leading-relaxed text-foreground/60">
              Usuario + PIN si ya tienes cuenta. Magic link si es tu primera
              vez o si olvidaste el PIN.
            </p>
          </div>

          {friendlyError && (
            <div className="flex items-start gap-3 border border-destructive/40 bg-destructive/[0.06] px-4 py-3">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                aria-hidden
              />
              <p className="font-mono text-xs leading-relaxed text-foreground/80">
                {friendlyError}
              </p>
            </div>
          )}

          <LoginForm />
        </div>
      </main>
    </div>
  );
}

function translateAuthError(reason: string, detail?: string): string {
  switch (reason) {
    case "missing":
      return "El enlace que abriste viene incompleto (sin token). Pide uno nuevo abajo.";
    case "expired_or_used":
      // Supabase no distingue estos 2 casos — el token se invalida apenas se
      // consume, así que después de usarse luce idéntico a uno expirado.
      // Se lo decimos honesto al usuario.
      return "Este link ya no sirve — o ya lo usaste, o pasó más de una hora desde que lo pediste. Cualquiera de los dos, la solución es pedir uno nuevo abajo.";
    case "flow_mismatch":
      return "Este enlace usa un flujo antiguo de auth. Pide uno nuevo desde acá — los nuevos correos ya están en el flujo correcto.";
    case "other":
      return detail
        ? `No pudimos completar tu acceso: ${decodeURIComponent(detail)}`
        : "No pudimos completar tu acceso. Pide un link nuevo.";
    default:
      // Backward compat: si llega un error string suelto, lo mostramos.
      return `No pudimos completar tu acceso: ${decodeURIComponent(reason)}`;
  }
}
