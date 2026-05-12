import type { Metadata } from "next";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Ingresar",
  description:
    "Entra a BØLG Atlas con tu correo. Te enviamos un enlace de acceso, sin contraseñas.",
};

export default function LoginPage() {
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
              Te enviamos un enlace de acceso.
            </h1>
            <p className="text-base leading-relaxed text-foreground/60">
              Sin contraseñas. Pones tu correo, revisas tu bandeja, vuelves.
              Si es tu primera vez, te creamos la cuenta automáticamente.
            </p>
          </div>

          <LoginForm />
        </div>
      </main>
    </div>
  );
}
