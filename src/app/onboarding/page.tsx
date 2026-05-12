import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm, type ModelLite } from "./OnboardingForm";

export const metadata: Metadata = {
  title: "Bienvenido al Atlas",
  description: "Configurá tu perfil en BØLG Atlas en 60 segundos.",
};

// Provisional usernames look like `user_a1b2c3d4` (set by the auth trigger).
const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/onboarding");

  const { data: profile } = await supabase
    .from("users")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  // Skip onboarding if the user already picked a real username.
  if (
    profile?.username &&
    !PROVISIONAL_USERNAME_RE.test(profile.username as string)
  ) {
    redirect("/dashboard");
  }

  const { data: catalogRaw } = await supabase
    .from("product_models")
    .select("id, name, category, hero_image_url")
    .order("name");

  const catalog: ModelLite[] = (catalogRaw ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    category: (c.category as string | null) ?? null,
    heroImageUrl: (c.hero_image_url as string | null) ?? null,
  }));

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
      </header>

      <main className="flex flex-1 justify-center px-6 pb-24 pt-4 md:px-10">
        <div className="flex w-full max-w-2xl flex-col gap-10">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
              Bienvenido al Atlas BØLG
            </span>
            <h1 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
              Antes de empezar, cuéntale al Atlas BØLG quién eres.
            </h1>
            <p className="text-base leading-relaxed text-foreground/65">
              60 segundos. Después subimos tu primer viaje juntos.
            </p>
          </div>

          <OnboardingForm
            initialDisplayName={(profile?.display_name as string | null) ?? ""}
            catalog={catalog}
          />
        </div>
      </main>
    </div>
  );
}
