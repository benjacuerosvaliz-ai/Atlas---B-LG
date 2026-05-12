import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tu dashboard BØLG Atlas.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("username, display_name, total_km, level")
    .eq("id", user.id)
    .single();

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-display text-xl font-black leading-none tracking-tight md:text-2xl">
            BØLG
          </span>
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/50">
            Atlas
          </span>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col gap-12 px-6 pb-24 pt-8 md:px-10">
        <section className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            Bienvenido
          </span>
          <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
            Hola, {profile?.display_name ?? user.email}.
          </h1>
          <p className="font-mono text-sm text-foreground/50">
            @{profile?.username ?? "—"}
            <span className="px-2">·</span>
            Nivel {profile?.level ?? 1}
            <span className="px-2">·</span>
            {(profile?.total_km ?? 0).toLocaleString("es-CL")} km
          </p>
        </section>

        <section className="border-t border-border pt-8">
          <p className="max-w-md font-mono text-sm leading-relaxed text-foreground/60">
            Tu dashboard real llega en Sesión 3: vinculación de productos,
            primer trip, recap. Por ahora estás autenticado — eso es lo
            importante.
          </p>
        </section>
      </main>
    </div>
  );
}
