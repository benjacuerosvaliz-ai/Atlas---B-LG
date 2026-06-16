import { BolgWordmark } from "@/components/bolg-wordmark";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href={null} />
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-foreground/45">
          Cargando ranking…
        </span>
      </main>
    </div>
  );
}
