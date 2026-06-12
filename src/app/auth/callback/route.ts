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
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash! });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  if (await needsOnboarding(supabase)) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
