import { BolgWordmark } from "@/components/bolg-wordmark";

export default function Loading() {
  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 md:px-8 md:py-5">
        <BolgWordmark href={null} />
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground/45">
          Cargando atlas…
        </span>
      </main>
    </div>
  );
}
