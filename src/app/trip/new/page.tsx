import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { isProvisionalUsername } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { TripWizard } from "./TripWizard";
import type { ProductModelLite } from "./types";

export const metadata: Metadata = {
  title: "Nuevo viaje",
  description: "Sube tu aventura al Atlas BØLG.",
};

export default async function NewTripPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/trip/new");

  // Force onboarding before letting them create a trip.
  const { data: usernameRow } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();
  if (isProvisionalUsername(usernameRow?.username as string | null)) {
    redirect("/onboarding");
  }

  // Load the full catalog (hero image + product URL) and the user's
  // current collection in parallel. The wizard renders all models as a
  // catalog grid; rows the user already claimed get an "already in your
  // gear" hint.
  const [{ data: models }, { data: claimed }] = await Promise.all([
    supabase
      .from("product_models")
      .select("id, name, category, hero_image_url, product_url")
      .order("name"),
    supabase
      .from("user_claimed_models")
      .select("model_id")
      .eq("user_id", user.id),
  ]);

  const ownedSet = new Set((claimed ?? []).map((r) => r.model_id as string));

  const catalog: ProductModelLite[] = (models ?? []).map((m) => ({
    id: m.id as string,
    name: m.name as string,
    category: (m.category as string | null) ?? null,
    heroImageUrl: (m.hero_image_url as string | null) ?? null,
    productUrl: (m.product_url as string | null) ?? null,
    alreadyOwned: ownedSet.has(m.id as string),
  }));

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/dashboard" />
        <Link
          href="/dashboard"
          className="text-[10px] uppercase tracking-[0.28em] text-foreground/60 hover:text-foreground transition-colors"
        >
          Cancelar
        </Link>
      </header>

      <main className="flex flex-1 justify-center px-6 pb-24 pt-4 md:px-10">
        <TripWizard catalog={catalog} />
      </main>
    </div>
  );
}
