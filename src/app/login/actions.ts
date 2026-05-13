"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  status: "idle" | "sent" | "error";
  message?: string;
  email?: string;
};

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Correo no válido." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "sent", email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// PIN login
// ---------------------------------------------------------------------------

export type PinLoginState = {
  status: "idle" | "error";
  message?: string;
};

/**
 * Validates (username, PIN) via the verify_pin_for_username RPC, then —
 * if correct — uses the admin client to generate a one-shot OTP for that
 * email and immediately verifies it from our server-side cookie context,
 * which creates the Supabase session cookie. No email is actually sent.
 */
export async function signInWithPin(
  _prev: PinLoginState,
  formData: FormData,
): Promise<PinLoginState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const pin = String(formData.get("pin") ?? "").trim();

  if (!username || !/^[a-z0-9_]{3,30}$/.test(username)) {
    return { status: "error", message: "Usuario inválido." };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { status: "error", message: "El PIN debe ser 4 dígitos." };
  }

  const supabase = await createClient();

  // Step 1: verify via RPC. Anon-callable; returns the email only on success.
  const { data: result, error: rpcErr } = await supabase.rpc(
    "verify_pin_for_username",
    { p_username: username, p_pin: pin },
  );

  if (rpcErr) {
    console.error("[pin-login] rpc", rpcErr);
    return { status: "error", message: "No pudimos verificar tu PIN. Reintenta." };
  }

  type RpcResult =
    | { status: "ok"; user_id: string; email: string }
    | { status: "failed"; attempts_left: number }
    | { status: "locked"; locked_until: string }
    | { status: "unknown" };

  const res = result as RpcResult;

  if (res.status === "unknown") {
    return {
      status: "error",
      message: "Usuario o PIN incorrectos.",
    };
  }
  if (res.status === "locked") {
    const until = new Date(res.locked_until);
    const mins = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000));
    return {
      status: "error",
      message: `Cuenta bloqueada por demasiados intentos. Vuelve a probar en ${mins} min — o entra con magic link.`,
    };
  }
  if (res.status === "failed") {
    const n = res.attempts_left;
    return {
      status: "error",
      message: `PIN incorrecto. Te quedan ${n} ${n === 1 ? "intento" : "intentos"} antes de bloquearte.`,
    };
  }

  // res.status === "ok" — issue a session for res.email.
  const admin = createAdminClient();
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink(
    { type: "magiclink", email: res.email },
  );
  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error("[pin-login] generateLink", linkErr);
    return {
      status: "error",
      message: "No pudimos crear la sesión. Usa el magic link mientras tanto.",
    };
  }

  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyErr) {
    console.error("[pin-login] verifyOtp", verifyErr);
    return {
      status: "error",
      message: "No pudimos crear la sesión. Usa el magic link mientras tanto.",
    };
  }

  redirect("/dashboard");
}
