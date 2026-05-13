"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  status: "idle" | "error";
  message?: string;
};

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const INSTAGRAM_RE = /^[a-z0-9._]{1,30}$/;
const PIN_RE = /^\d{4}$/;
const RESERVED_USERNAMES = new Set([
  "admin",
  "atlas",
  "bolg",
  "settings",
  "dashboard",
  "trip",
  "sku",
  "auth",
  "login",
  "me",
  "api",
  "onboarding",
]);

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Tu sesión expiró." };

  const mode = String(formData.get("mode") ?? "full") as "full" | "pin-only";
  const pin = String(formData.get("pin") ?? "");
  const pinConfirm = String(formData.get("pin_confirm") ?? "");

  if (!PIN_RE.test(pin)) {
    return { status: "error", message: "El PIN debe ser exactamente 4 dígitos." };
  }
  if (pin !== pinConfirm) {
    return { status: "error", message: "Los dos PINs no coinciden." };
  }

  // PIN-only flow: existing user just needs to set their PIN.
  if (mode === "pin-only") {
    const { error: pinErr } = await supabase.rpc("set_my_pin", { p_pin: pin });
    if (pinErr) {
      return {
        status: "error",
        message: pinErr.message ?? "No se pudo guardar el PIN.",
      };
    }
    redirect("/dashboard");
  }

  // Full flow: username + identity + PIN + (optional gear).
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const instagramRaw = String(formData.get("instagram_handle") ?? "").trim();
  const instagram = instagramRaw.replace(/^@/, "").toLowerCase();
  const selectedModels = String(formData.get("selected_models") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!USERNAME_RE.test(username)) {
    return {
      status: "error",
      message: "Username inválido. Minúsculas, números, _, 3-30 caracteres.",
    };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { status: "error", message: "Ese username está reservado." };
  }
  if (displayName.length < 1 || displayName.length > 80) {
    return { status: "error", message: "El nombre es obligatorio (max 80)." };
  }
  if (instagram && !INSTAGRAM_RE.test(instagram)) {
    return {
      status: "error",
      message: "Handle de Instagram inválido. Solo letras, números, . y _",
    };
  }

  const { error: profileErr } = await supabase
    .from("users")
    .update({
      username,
      display_name: displayName,
      city: city || null,
      instagram_handle: instagram || null,
    })
    .eq("id", user.id);

  if (profileErr) {
    if (profileErr.code === "23505") {
      return {
        status: "error",
        message: "Ese username ya está tomado. Prueba otro.",
      };
    }
    return {
      status: "error",
      message: profileErr.message ?? "No se pudo guardar.",
    };
  }

  // Set the PIN via RPC (security definer, hashes with bcrypt server-side).
  const { error: pinErr } = await supabase.rpc("set_my_pin", { p_pin: pin });
  if (pinErr) {
    return {
      status: "error",
      message: `Perfil guardado pero el PIN falló: ${pinErr.message ?? "error"}. Reintenta.`,
    };
  }

  if (selectedModels.length > 0) {
    const { error: gearErr } = await supabase
      .from("user_claimed_models")
      .upsert(
        selectedModels.map((modelId) => ({
          user_id: user.id,
          model_id: modelId,
        })),
        { onConflict: "user_id,model_id", ignoreDuplicates: true },
      );
    if (gearErr) {
      console.error("[onboarding] user_claimed_models", gearErr);
      // Not fatal — they can claim again from /trip/new later.
    }
  }

  redirect("/dashboard");
}
