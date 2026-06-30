import { NextResponse, type NextRequest } from "next/server";

/**
 * CSP violation report sink.
 *
 * El header `Content-Security-Policy-Report-Only` definido en next.config.ts
 * apunta acá. Los navegadores envían dos formatos:
 *   - `application/csp-report` (legacy report-uri): { "csp-report": { ... } }
 *   - `application/reports+json` (Reporting API): [{ type, age, body, ... }]
 *
 * Solo logueamos a stdout estructurado — Vercel/console se encarga del resto.
 * Respondemos 204 para que el navegador no haga retry.
 *
 * Rate-limit en memoria: máx 10 reports/min por IP. Suficiente para evitar
 * que un atacante o un bug noisy llene los logs; no pretende ser defensa
 * real (el proceso se recicla en cada cold start de Vercel).
 */

export const runtime = "nodejs";

type ReportBucket = { count: number; resetAt: number };
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const buckets = new Map<string, ReportBucket>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  if (isRateLimited(ip)) {
    // Silently drop — no warn (la idea es no llenar logs).
    return new NextResponse(null, { status: 204 });
  }

  let payload: unknown = null;
  try {
    // Aceptamos cualquier content-type — el body parser de JSON cubre ambos
    // formatos modernos. Si el body viene vacío, queda en null.
    const text = await req.text();
    if (text) payload = JSON.parse(text);
  } catch {
    // Body no parseable — registramos igual para no perder el evento.
    payload = { parseError: true };
  }

  // Log estructurado en una línea para que Vercel lo indexe bien.
  console.warn(
    "[csp-report]",
    JSON.stringify({
      ip,
      ua: req.headers.get("user-agent"),
      contentType: req.headers.get("content-type"),
      report: payload,
    }),
  );

  return new NextResponse(null, { status: 204 });
}
