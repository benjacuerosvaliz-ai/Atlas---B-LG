import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = {
  title: "Editar perfil",
  description: "Tu nombre, tu handle, tu identidad en el Atlas.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/settings");

  const { data: profile } = await supabase
    .from("users")
    .select("username, display_name, bio, country_code, city, instagram_handle")
    .eq("id", user.id)
    .single();

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <Link href="/dashboard" className="flex items-baseline gap-3">
          <span className="font-display text-xl font-black leading-none tracking-tight md:text-2xl">
            BØLG
          </span>
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/50">
            Atlas
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
        >
          Volver
        </Link>
      </header>

      <main className="flex flex-1 justify-center px-6 pb-24 pt-4 md:px-10">
        <div className="flex w-full max-w-xl flex-col gap-10">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Tu perfil
            </span>
            <h1 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
              ¿Cómo quieres que te conozcan?
            </h1>
            <p className="text-base leading-relaxed text-foreground/60">
              Tu nombre y tu handle son lo que ven en el Atlas. Puedes
              cambiarlos cuando quieras.
            </p>
          </div>

          <SettingsForm
            initialDisplayName={profile?.display_name ?? ""}
            initialUsername={profile?.username ?? ""}
            initialBio={profile?.bio ?? ""}
            initialCity={profile?.city ?? ""}
            initialInstagram={profile?.instagram_handle ?? ""}
            email={user.email ?? ""}
          />
        </div>
      </main>
    </div>
  );
}
