import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A user "needs onboarding" while their username still matches the
 * provisional pattern the auth trigger generates (user_<8 hex chars>).
 * Once they pick a real handle through /onboarding or /settings, we
 * leave them alone.
 */
const PROVISIONAL_USERNAME_RE = /^user_[a-f0-9]+$/;

export async function needsOnboarding(
  supabase: SupabaseClient,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  const username = data?.username as string | null | undefined;
  return !username || PROVISIONAL_USERNAME_RE.test(username);
}

export function isProvisionalUsername(username: string | null | undefined): boolean {
  if (!username) return true;
  return PROVISIONAL_USERNAME_RE.test(username);
}
