import { NextResponse } from "next/server";
import { isProvisionalUsername } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

/**
 * Shortcut: /me → /u/{my-username}. If not signed in, bounce to /login.
 * If still on the provisional username, bounce to /onboarding first.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL(request.url);

  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/me", url.origin));
  }

  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  const username = profile?.username as string | null | undefined;
  if (isProvisionalUsername(username)) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  return NextResponse.redirect(new URL(`/u/${username}`, url.origin));
}
