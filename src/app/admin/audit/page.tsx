import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BolgWordmark } from "@/components/bolg-wordmark";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Auditoría de viajes — Admin",
  description: "Trips marcados para revisión manual (anti-fraude soft).",
};

/**
 * Misma whitelist que /admin/migrar-viajes — esta página solo la ve
 * Benja. Si en el futuro hay más admins, esto se mueve a una columna
 * `role` en `users` y se chequea ahí.
 */
const ADMIN_EMAILS = new Set([
  "benja.bolgen@gmail.com",
  "benja.cuerosvaliz@gmail.com",
]);

/**
 * Página de auditoría: lista los trips con `is_validated=false` que
 * cayeron al bucket de review manual. Hoy llegan acá por una sola
 * razón (origen ≈ destino, ver /trip/new/actions.ts), pero el modelo
 * está abierto a que sumemos más heurísticas y todas confluyan acá.
 *
 * Vista pura por ahora — sin acciones de validar/rechazar. Cuando el
 * volumen lo pida agregamos botones que muten `is_validated` y
 * `validation_method`. Mientras tanto, el objetivo es solo ver qué
 * tipo de loops están entrando para calibrar el radio (1 km hoy).
 */
export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/audit");
  if (!ADMIN_EMAILS.has(user.email ?? "")) {
    return <div className="p-10 font-mono text-sm">403 · No autorizado.</div>;
  }

  const { data: rows, error } = await supabase
    .from("trips")
    .select(
      `id, start_short_name, end_short_name, start_place_name, end_place_name,
       start_lat, start_lng, end_lat, end_lng, distance_km, start_at,
       counts_for_bolg, validation_method, user_id,
       users(username, display_name)`,
    )
    .eq("is_validated", false)
    .order("start_at", { ascending: false })
    .limit(200);

  type Row = {
    id: string;
    start_short_name: string | null;
    end_short_name: string | null;
    start_place_name: string | null;
    end_place_name: string | null;
    start_lat: number | null;
    start_lng: number | null;
    end_lat: number | null;
    end_lng: number | null;
    distance_km: number | null;
    start_at: string | null;
    counts_for_bolg: boolean | null;
    validation_method: string | null;
    user_id: string;
    users: { username: string; display_name: string | null } | null;
  };

  const trips: Row[] = ((rows ?? []) as unknown as Row[]) ?? [];

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <BolgWordmark href="/" />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
          Admin · Auditoría
        </span>
      </header>

      <main className="flex flex-1 flex-col gap-10 px-6 pb-24 pt-4 md:px-10">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            Trips pendientes de revisión
          </span>
          <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
            Loops sospechosos.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-foreground/65">
            Viajes donde origen y destino quedan a menos de 1 km. Se guardan
            pero no cuentan para BØLG-100 hasta que los valides. Si ves
            patrones legítimos repetidos, ajustamos el radio.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/50">
            {trips.length} {trips.length === 1 ? "trip" : "trips"} en cola
            {error ? " · error al cargar" : ""}
          </p>
        </section>

        <section className="mx-auto w-full max-w-5xl">
          {trips.length === 0 ? (
            <div className="border border-foreground/10 bg-card/60 p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/50">
                Cola vacía
              </p>
              <p className="mt-3 text-sm text-foreground/65">
                Ningún trip pendiente de review manual ahora mismo.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-foreground/10 border border-foreground/10">
              {trips.map((t) => {
                const who =
                  t.users?.display_name ??
                  t.users?.username ??
                  t.user_id.slice(0, 8);
                const origin =
                  t.start_short_name ?? t.start_place_name ?? "—";
                const dest = t.end_short_name ?? t.end_place_name ?? "—";
                const dist =
                  t.distance_km != null
                    ? `${t.distance_km.toFixed(2)} km`
                    : "?";
                return (
                  <li
                    key={t.id}
                    className="flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                        {t.start_at ?? "sin fecha"} · {who}
                      </span>
                      <span className="text-sm text-foreground/85">
                        {origin} → {dest}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/50">
                        {dist}
                        {t.counts_for_bolg ? " · BØLG" : ""}
                        {t.validation_method
                          ? ` · ${t.validation_method}`
                          : ""}
                      </span>
                    </div>
                    <Link
                      href={`/t/${t.id}`}
                      className="self-start border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/75 transition-colors hover:border-foreground/40 hover:text-foreground md:self-auto"
                    >
                      Ver viaje →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
