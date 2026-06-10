import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Endpoint que el admin (Benja) abre desde el mail del cron mensual.
 *
 * GET: muestra el detalle del ganador.
 * POST: confirma + dispara el mail al ganador (status='notified').
 *
 * El token actúa como capability — quien lo tiene puede confirmar. No
 * hay UI separado de login porque el admin clickea el link del mail.
 */

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const admin = createAdminClient();
  const { data: prize } = await admin
    .from("monthly_prizes")
    .select(
      `id, prize_month, prize_type, status, continents_count, countries_count,
       cities_count, notified_at,
       users:winner_id(username, display_name, email)`,
    )
    .eq("admin_token", token)
    .maybeSingle();

  if (!prize) {
    return new Response("Premio no encontrado o token inválido", {
      status: 404,
    });
  }

  type WinnerInfo = {
    username: string | null;
    display_name: string | null;
    email: string | null;
  } | null;
  const w = prize.users as unknown as WinnerInfo;

  const status = String(prize.status);
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Premio mensual — BØLG Atlas</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
           background:#0a0a0a; color:#f4f1ea; margin:0; padding:48px 24px;
           min-height:100vh; }
    main { max-width:560px; margin:0 auto; }
    h1 { font-size:36px; font-weight:900; letter-spacing:-0.02em; margin:0 0 8px; }
    .pill { display:inline-block; padding:6px 12px; border:1px solid;
            font-size:10px; letter-spacing:0.28em; text-transform:uppercase; margin-bottom:32px; }
    .calculated { border-color:#d4a373; color:#d4a373; }
    .notified { border-color:#5bc0be; color:#5bc0be; }
    dl { border-top:1px solid rgba(244,241,234,0.15); margin:32px 0; padding-top:24px; }
    dt { font-size:10px; letter-spacing:0.28em; text-transform:uppercase;
         color:rgba(244,241,234,0.5); margin-top:16px; }
    dd { font-size:18px; margin:4px 0 0; }
    form { margin-top:32px; }
    button { background:#f4f1ea; color:#0a0a0a; border:none; padding:18px 28px;
             font-size:11px; letter-spacing:0.28em; text-transform:uppercase;
             cursor:pointer; font-weight:600; }
    button:hover { background:#e8e4dc; }
    .done { padding:24px; border:1px solid rgba(91,192,190,0.5);
            background:rgba(91,192,190,0.08); color:#5bc0be; margin-top:32px; }
  </style>
</head>
<body>
  <main>
    <h1>🏆 Premio mensual</h1>
    <span class="pill ${status}">${status === "notified" ? "Ya notificado" : "Pendiente de confirmar"}</span>

    <dl>
      <dt>Mes</dt><dd>${String(prize.prize_month).slice(0, 7)}</dd>
      <dt>Ganador</dt><dd>${w?.display_name ?? w?.username ?? "—"} (@${w?.username ?? "?"})</dd>
      <dt>Email del ganador</dt><dd>${w?.email ?? "—"}</dd>
      <dt>Continentes</dt><dd>${prize.continents_count}</dd>
      <dt>Países</dt><dd>${prize.countries_count}</dd>
      <dt>Ciudades</dt><dd>${prize.cities_count}</dd>
    </dl>

    ${
      status === "notified"
        ? `<div class="done">Ya enviaste el mail al ganador el ${prize.notified_at}.</div>`
        : `<form method="post" action="">
             <button type="submit">Confirmar y notificar al ganador →</button>
           </form>`
    }
  </main>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function POST(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const admin = createAdminClient();
  const { data: prize } = await admin
    .from("monthly_prizes")
    .select(
      `id, prize_month, status,
       users:winner_id(username, display_name, email)`,
    )
    .eq("admin_token", token)
    .maybeSingle();

  if (!prize) return new Response("Token inválido", { status: 404 });
  if (prize.status !== "calculated") {
    return new Response("Ya procesado", { status: 400 });
  }

  type WinnerInfo = {
    username: string | null;
    display_name: string | null;
    email: string | null;
  } | null;
  const w = prize.users as unknown as WinnerInfo;
  if (!w?.email) {
    return new Response("Ganador sin email registrado", { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);
    const month = String(prize.prize_month).slice(0, 7);
    await resend.emails.send({
      from: "atlas@bolg.cl",
      to: w.email,
      subject: `🏆 Eres el conquistador BØLG de ${month}`,
      text: [
        `Hola ${w.display_name ?? w.username},`,
        ``,
        `Felicitaciones — eres el conquistador BØLG del mes ${month}.`,
        `Tu premio:`,
        `  - Un parche personalizado`,
        `  - $100.000 CLP en producto BØLG`,
        `  - Llavero + charms de tus países conquistados`,
        `  - Mención en mailing y redes sociales BØLG`,
        ``,
        `Te contactaremos pronto para coordinar el envío.`,
        ``,
        `Sigue conquistando.`,
        `— Equipo BØLG`,
      ].join("\n"),
    });
  }

  await admin
    .from("monthly_prizes")
    .update({ status: "notified", notified_at: new Date().toISOString() })
    .eq("id", prize.id);

  return new Response(
    `<html><body style="font-family:sans-serif;background:#0a0a0a;color:#5bc0be;padding:64px;text-align:center;"><h1>✓ Mail enviado a @${w.username}</h1><p>El status ahora es "notified". Puedes cerrar esta ventana.</p></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
