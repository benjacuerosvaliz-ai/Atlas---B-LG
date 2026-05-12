import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Use in "use client" components that need
 * to read auth state or call RLS-respecting queries directly from the
 * browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
