import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Shortcut: /me → /u/{my-username}. If not signed in, bounce to /login.
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

  if (!profile?.username) {
    // Edge case: row exists but no username. Send to settings to set one.
    return NextResponse.redirect(new URL("/settings", url.origin));
  }

  return NextResponse.redirect(new URL(`/u/${profile.username}`, url.origin));
}
