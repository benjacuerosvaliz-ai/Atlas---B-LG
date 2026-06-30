import Link from "next/link";
import { Navbar } from "@/components/Navbar";

// Shared chrome for the three legal pages (/terminos, /privacidad, /cookies).
// Each page now only owns its TOC entries and section bodies — header, hero,
// sticky TOC scaffolding and footer all live here so the look stays in sync
// when we touch one of them. The Section/LegalFooter helpers are exported so
// pages compose their own content with the same primitives.

export type LegalSection = {
  /** Anchor id used by both the TOC link and the <Section id>. */
  id: string;
  /** Label shown in the sticky TOC (already includes its "01 · ..." prefix). */
  label: string;
};

type LegalLayoutProps = {
  /** Page title shown in the hero (e.g. "Términos de uso."). */
  title: string;
  /** Eyebrow above the title. Defaults to "Legal · BØLG Atlas". */
  subtitle?: string;
  /** Human-readable date string shown under the title. */
  lastUpdated: string;
  /** TOC entries — order here is the order rendered. */
  sections: readonly LegalSection[];
  /** Page body — a column of <Section> children. */
  children: React.ReactNode;
};

export function LegalLayout({
  title,
  subtitle = "Legal · BØLG Atlas",
  lastUpdated,
  sections,
  children,
}: LegalLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />

      <main className="relative px-6 pb-24 pt-28 md:px-10 lg:pt-32">
        {/* Hero */}
        <section className="mx-auto flex max-w-4xl flex-col gap-5">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            {subtitle}
          </span>
          <h1 className="font-display text-4xl font-black leading-[1.04] tracking-tight md:text-5xl lg:text-[3.75rem]">
            {title}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
            Última actualización: {lastUpdated}
          </p>
        </section>

        {/* Cuerpo en dos columnas: TOC sticky + contenido */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-[200px_1fr] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40">
              Índice
            </span>
            <ol className="mt-4 flex flex-col gap-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground transition-colors"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="flex flex-col gap-12 leading-relaxed text-foreground/75">
            {children}
          </article>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}

type SectionProps = {
  /** Must match the matching {@link LegalSection.id} so the TOC link scrolls here. */
  id: string;
  /** Numeric prefix shown above the heading (1 → "01"). */
  n: number;
  /** Heading text. */
  title: string;
  children: React.ReactNode;
};

/**
 * One numbered chapter inside a legal page. Same visual treatment across
 * /terminos, /privacidad and /cookies — pages just hand it the id, number,
 * title and body copy.
 */
export function Section({ id, n, title, children }: SectionProps) {
  return (
    <section
      id={id}
      className="flex scroll-mt-28 flex-col gap-4 border-t border-border pt-6"
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.28em] text-foreground/40">
          {String(n).padStart(2, "0")}
        </span>
      </div>
      <h2 className="font-display text-2xl font-black leading-tight tracking-tight md:text-3xl">
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/70 md:text-base">
        {children}
      </div>
    </section>
  );
}

/**
 * Footer with cross-links between the three legal pages and a couple of
 * shortcuts back to the product. Rendered automatically by {@link LegalLayout}
 * — it's exported in case a future legal-adjacent page wants to reuse just
 * the footer without the rest of the chrome.
 *
 * Note: this is NOT the global site footer (see Track C). It's intentionally
 * minimal and scoped to the legal section, where the user is already in
 * "read the fine print" mode and a busy footer would be noise.
 */
export function LegalFooter() {
  return (
    <footer className="border-t border-border px-6 py-8 md:px-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          BØLG Atlas · {new Date().getFullYear()}
        </span>
        <div className="flex flex-wrap gap-6">
          <Link
            href="/terminos"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            Términos
          </Link>
          <Link
            href="/privacidad"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            Privacidad
          </Link>
          <Link
            href="/cookies"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            Cookies
          </Link>
          <Link
            href="/sobre"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            Sobre Atlas
          </Link>
          <a
            href="https://www.bolg.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            bolg.cl ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
