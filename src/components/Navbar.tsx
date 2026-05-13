import Link from "next/link";
import { BolgWordmark } from "@/components/bolg-wordmark";

export function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-40 px-6 py-5 md:px-10 md:py-7">
      <div className="flex items-center justify-between">
        <BolgWordmark href="/" />
        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className="hidden text-[10px] uppercase tracking-[0.32em] text-foreground/60 hover:text-foreground transition-colors sm:inline"
          >
            Atlas global
          </Link>
          <Link
            href="/explorar"
            className="hidden text-[10px] uppercase tracking-[0.32em] text-foreground/60 hover:text-foreground transition-colors sm:inline"
          >
            Comunidad
          </Link>
          <Link
            href="/sobre"
            className="hidden text-[10px] uppercase tracking-[0.32em] text-foreground/60 hover:text-foreground transition-colors sm:inline"
          >
            ¿Cómo funciona?
          </Link>
          <Link
            href="/login"
            className="text-[10px] uppercase tracking-[0.32em] text-foreground/60 hover:text-foreground transition-colors"
          >
            Ingresar
          </Link>
        </nav>
      </div>
    </header>
  );
}
