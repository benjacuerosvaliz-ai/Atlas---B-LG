import { Navbar } from "@/components/Navbar";
import { Globe } from "@/components/globe/Globe";
import { KpiStrip } from "@/components/KpiStrip";
import { EmailCapture } from "@/components/EmailCapture";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />
      <main className="relative flex flex-col gap-16 px-6 pb-24 pt-28 md:px-10 lg:gap-24 lg:pt-32">
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <Globe />
          </div>

          <div className="order-1 flex flex-col gap-10 lg:order-2 lg:pl-4">
            <div className="flex flex-col gap-5">
              <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
                BØLG Atlas · Próximamente
              </span>
              <h1 className="font-display text-4xl font-black leading-[1.04] tracking-tight md:text-5xl lg:text-[3.75rem]">
                Las olas no se quedan quietas.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-foreground/65 md:text-lg">
                La bitácora de todas las BØLG del mundo. Cada producto suma kilómetros, países y dueños sucesivos. Cada viaje pinta el globo.
              </p>
            </div>

            <KpiStrip />

            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/40">
                Lista de espera
              </span>
              <EmailCapture />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
