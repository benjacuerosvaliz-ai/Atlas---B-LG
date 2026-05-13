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
    .select("username, display_name, pin_hash")
    .eq("id", user.id)
    .single();

  const hasRealUsername =
    !!profile?.username &&
    !PROVISIONAL_USERNAME_RE.test(profile.username as string);
  const hasPin = !!profile?.pin_hash;

  // Both done → out of here.
  if (hasRealUsername && hasPin) {
    redirect("/dashboard");
  }

  // Existing users (real username, no PIN yet) get a stripped-down form
  // that only asks for the PIN — don't make them re-type their handle.
  if (hasRealUsername && !hasPin) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
          <BolgWordmark href="/" />
        </header>

        <main className="flex flex-1 justify-center px-6 pb-24 pt-4 md:px-10">
          <div className="flex w-full max-w-2xl flex-col gap-10">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
                Un paso más
              </span>
              <h1 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
                Crea tu PIN de 4 dígitos.
              </h1>
              <p className="text-base leading-relaxed text-foreground/65">
                A partir de ahora puedes entrar con{" "}
                <span className="font-mono text-foreground">
                  @{profile?.username as string}
                </span>{" "}
                + PIN, sin esperar el correo. El magic link sigue funcionando
                como respaldo.
              </p>
            </div>

            <OnboardingForm
              mode="pin-only"
              initialDisplayName={
                (profile?.display_name as string | null) ?? ""
              }
              catalog={[]}
            />
          </div>
        </main>
      </div>
    );
  }

  // First-time onboarding: full form (username + PIN + gear).
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
            mode="full"
            initialDisplayName={(profile?.display_name as string | null) ?? ""}
            catalog={catalog}
          />
        </div>
      </main>
    </div>
  );
}
