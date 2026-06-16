import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { needsOnboarding } from "@/lib/onboarding";

/**
 * OAuth/magic-link callback. Supabase appends `?code=...` to the redirect
 * URL after the user clicks the email link; we exchange that code for a
 * session, set the cookie, and bounce them to /dashboard (or wherever
 * `next` told us to go) — unless they still have a provisional username,
 * in which case we send them through onboarding first.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing", url.origin));
  }

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash! });

  if (error) {
    // Supabase NO distingue entre "token ya usado" y "token expirado" —
    // ambos casos devuelven `otp_expired` con el mismo mensaje. Esto es
    // by-design: el token se invalida apenas se consume. Así que
    // categorizamos como "expired_or_used" en lugar de pretender que
    // sabemos cuál es.
    const code = error.code ?? "";
    const msg = (error.message ?? "").toLowerCase();
    let reason: string;
    if (
      code === "otp_expired" ||
      msg.includes("expired") ||
      msg.includes("invalid") ||
      msg.includes("not found")
    ) {
      reason = "expired_or_used";
    } else if (msg.includes("code challenge") || msg.includes("verifier")) {
      reason = "flow_mismatch";
    } else {
      reason = "other";
    }
    const params = new URLSearchParams({ error: reason });
    if (reason === "other") params.set("detail", error.message);
    return NextResponse.redirect(
      new URL(`/login?${params.toString()}`, url.origin),
    );
  }

  if (await needsOnboarding(supabase)) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
