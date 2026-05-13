import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Onboarding is "incomplete" while either:
 *   - the username still matches the provisional pattern the auth trigger
 *     generates (user_<hex>), OR
 *   - the user hasn't set their 4-digit PIN yet (pin_hash is null).
 *
 * Both are required before we let users into the rest of the app.
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
    .select("username, pin_hash")
    .eq("id", user.id)
    .single();

  const username = data?.username as string | null | undefined;
  const pinHash = data?.pin_hash as string | null | undefined;
  return (
    !username ||
    PROVISIONAL_USERNAME_RE.test(username) ||
    !pinHash
  );
}

export function isProvisionalUsername(username: string | null | undefined): boolean {
  if (!username) return true;
  return PROVISIONAL_USERNAME_RE.test(username);
}
