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
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  // Best-effort plain-Spanish translation for the most common Supabase
  // verifyOtp errors. Everything else falls through to the raw message.
  const friendlyError = error
    ? translateAuthError(decodeURIComponent(error))
    : null;

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

function translateAuthError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("missing_token") || lower.includes("missing token")) {
    return "El enlace que abriste no trae token. Pide uno nuevo.";
  }
  if (lower.includes("expired")) {
    return "El enlace expiró. Pide uno nuevo escribiendo tu correo abajo.";
  }
  if (lower.includes("invalid") || lower.includes("not found")) {
    return "Ese enlace ya fue usado o no es válido. Pide uno nuevo.";
  }
  if (lower.includes("code challenge") || lower.includes("verifier")) {
    return "Este enlace usa un flujo antiguo. Pedile uno nuevo desde acá — los nuevos correos ya están en el flujo correcto.";
  }
  return `No pudimos completar tu acceso: ${raw}`;
}
