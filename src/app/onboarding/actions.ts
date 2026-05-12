"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  status: "idle" | "error";
  message?: string;
};

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const INSTAGRAM_RE = /^[a-z0-9._]{1,30}$/;
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
        message: "Ese username ya está tomado. Probá otro.",
      };
    }
    return {
      status: "error",
      message: profileErr.message ?? "No se pudo guardar.",
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
