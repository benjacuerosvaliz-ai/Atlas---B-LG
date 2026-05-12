import Link from "next/link";

export function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-40 px-6 py-5 md:px-10 md:py-7">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-3 group">
          <span className="font-display text-xl font-black leading-none tracking-tight md:text-2xl">
            BØLG
          </span>
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/50 group-hover:text-foreground/80 transition-colors">
            Atlas
          </span>
        </Link>
        <Link
          href="#waitlist"
          className="text-[10px] uppercase tracking-[0.32em] text-foreground/60 hover:text-foreground transition-colors"
        >
          Ingresar
        </Link>
      </div>
    </header>
  );
}
