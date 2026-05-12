import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns a short-lived Cloudinary upload signature so the browser can
 * upload directly to api.cloudinary.com without proxying photos through
 * our Vercel function (avoids 4.5MB body limit, saves bandwidth).
 *
 * Auth: only signed-in users can request a signature. The signature
 * scopes uploads to a per-user folder so users can't write into each
 * other's areas.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // CLOUDINARY_URL env var is parsed by the SDK on import; no manual config needed.
  // We still verify it's there so failures are obvious.
  if (!process.env.CLOUDINARY_URL) {
    return NextResponse.json(
      { error: "cloudinary not configured" },
      { status: 500 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `atlas/trips/${user.id}`;

  // Params that will be signed. Cloudinary requires the same params in
  // the final upload request — any drift invalidates the signature.
  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    cloudinary.config().api_secret!,
  );

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    apiKey: cloudinary.config().api_key,
    cloudName: cloudinary.config().cloud_name,
  });
}
