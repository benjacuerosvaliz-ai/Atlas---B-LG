import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client (service_role). BYPASSES Row Level Security.
 *
 * Server-only. Never import from a "use client" file or any module that
 * ships to the browser. Use for: catalog seeds, badge awarding, Heritage
 * Mode product transfers, anything that needs to write across users.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
