import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { needsOnboarding } from "@/lib/onboarding";

/**
 * Email OTP verification. Receives ?token_hash=...&type=signup|magiclink|...
 * from Supabase email templates that we customized to use the token_hash
 * pattern (vs. legacy /auth/v1/verify → PKCE chain, which has a known
 * verifier-mismatch issue for signup confirmation).
 *
 * verifyOtp does both the email confirmation AND session creation in one
 * step, so we don't need PKCE here.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL("/login?error=missing_token", url.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        url.origin,
      ),
    );
  }

  if (await needsOnboarding(supabase)) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
