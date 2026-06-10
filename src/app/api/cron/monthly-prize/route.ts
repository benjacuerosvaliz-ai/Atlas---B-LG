import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron mensual: calcula al conquistador del mes anterior, lo guarda en
 * monthly_prizes (status=calculated) y manda mail al admin con link de
 * confirmación.
 *
 * Programado en vercel.json para el día 1 de cada mes 09:00 CLT.
 * Protegido por CRON_SECRET (encabezado Authorization).
 */

const ADMIN_EMAIL = "benja.bolgen@gmail.com";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!expected || auth !== `Bearer ${expected}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const admin = createAdminClient();

  // Mes a premiar = mes anterior (UTC).
  const now = new Date();
  const prizeMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const prizeMonthISO = prizeMonth.toISOString().slice(0, 10);

  // Idempotencia: si ya hay un row para este (prize_month, prize_type=main),
  // no reculculamos.
  const { data: existing } = await admin
    .from("monthly_prizes")
    .select("id")
    .eq("prize_month", prizeMonthISO)
    .eq("prize_type", "main")
    .maybeSingle();
  if (existing) {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "already calculated",
    });
  }

  // Trae el ranking actual + lista de ganadores anteriores para excluir.
  const [{ data: stats }, { data: priorWinners }] = await Promise.all([
    admin
      .from("user_conquest_stats")
      .select(
        `user_id, cities_conquered, countries_with_conquest,
         continents_with_conquest, last_conquest_at,
         users(username, display_name, email)`,
      ),
    admin.from("monthly_prizes").select("winner_id").eq("prize_type", "main"),
  ]);

  type StatRow = {
    user_id: string;
    cities_conquered: number | null;
    countries_with_conquest: number | null;
    continents_with_conquest: number | null;
    last_conquest_at: string | null;
    users: { username: string; display_name: string | null; email: string } | null;
  };

  const winnersBefore = new Set(
    (priorWinners ?? []).map((r) => r.winner_id as string),
  );

  const ranked = ((stats ?? []) as unknown as StatRow[])
    .filter((s) => s.users?.username && (s.cities_conquered ?? 0) > 0)
    .filter((s) => !winnersBefore.has(s.user_id))
    .sort((a, b) => {
      const ac = a.continents_with_conquest ?? 0;
      const bc = b.continents_with_conquest ?? 0;
      if (ac !== bc) return bc - ac;
      const ap = a.countries_with_conquest ?? 0;
      const bp = b.countries_with_conquest ?? 0;
      if (ap !== bp) return bp - ap;
      const aci = a.cities_conquered ?? 0;
      const bci = b.cities_conquered ?? 0;
      if (aci !== bci) return bci - aci;
      const at = a.last_conquest_at
        ? new Date(a.last_conquest_at).getTime()
        : Infinity;
      const bt = b.last_conquest_at
        ? new Date(b.last_conquest_at).getTime()
        : Infinity;
      return at - bt;
    });

  const winner = ranked[0];
  if (!winner) {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "no eligible winner",
    });
  }

  const token = randomBytes(24).toString("base64url");

  const { error: insertErr } = await admin.from("monthly_prizes").insert({
    prize_month: prizeMonthISO,
    prize_type: "main",
    winner_id: winner.user_id,
    continents_count: winner.continents_with_conquest ?? 0,
    countries_count: winner.countries_with_conquest ?? 0,
    cities_count: winner.cities_conquered ?? 0,
    admin_token: token,
  });
  if (insertErr) {
    console.error("[monthly-prize] insert", insertErr);
    return new Response("db error", { status: 500 });
  }

  // Mail al admin con link para confirmar y notificar.
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atlas.bolg.cl";
    const link = `${origin}/api/admin/monthly-prize/${token}`;
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "atlas@bolg.cl",
      to: ADMIN_EMAIL,
      subject: `🏆 Conquistador del mes ${prizeMonthISO.slice(0, 7)}`,
      text: [
        `Conquistador del mes ${prizeMonthISO.slice(0, 7)}: @${winner.users?.username}`,
        `Display: ${winner.users?.display_name ?? "—"}`,
        `Email: ${winner.users?.email ?? "—"}`,
        ``,
        `Stats:`,
        `- Continentes: ${winner.continents_with_conquest ?? 0}`,
        `- Países:      ${winner.countries_with_conquest ?? 0}`,
        `- Ciudades:    ${winner.cities_conquered ?? 0}`,
        ``,
        `Para confirmar y mandar el mail al ganador:`,
        link,
      ].join("\n"),
    });
  }

  return Response.json({
    ok: true,
    winner: { username: winner.users?.username, user_id: winner.user_id },
    prize_month: prizeMonthISO,
  });
}
