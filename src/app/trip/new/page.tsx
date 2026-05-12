import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripWizard } from "./TripWizard";

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

  // The user's currently-owned products (for Step 5). Empty in early
  // sessions until QR vinculation lands.
  const { data: ownedProducts } = await supabase
    .from("products")
    .select("id, given_name, model_id, product_models(name)")
    .eq("current_owner_id", user.id)
    .eq("status", "active");

  const products = (ownedProducts ?? []).map((p) => ({
    id: p.id as string,
    givenName: (p.given_name as string | null) ?? null,
    modelName:
      (p.product_models as unknown as { name: string } | null)?.name ?? "",
  }));

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
          Cancelar
        </Link>
      </header>

      <main className="flex flex-1 justify-center px-6 pb-24 pt-4 md:px-10">
        <TripWizard products={products} />
      </main>
    </div>
  );
}
