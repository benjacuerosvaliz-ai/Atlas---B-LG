"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = {
  status: "idle" | "error";
  message?: string;
};

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const INSTAGRAM_RE = /^[a-z0-9._]{1,30}$/;

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Tu sesión expiró." };

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  // Instagram: strip a leading @ if the user pasted one; normalize to lowercase.
  const instagramRaw = String(formData.get("instagram_handle") ?? "").trim();
  const instagram = instagramRaw.replace(/^@/, "").toLowerCase();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const coverUrl = String(formData.get("cover_url") ?? "").trim();

  if (!USERNAME_RE.test(username)) {
    return {
      status: "error",
      message:
        "Username inválido. Solo letras minúsculas, números y guión bajo. Entre 3 y 30 caracteres.",
    };
  }
  if (displayName.length < 1 || displayName.length > 80) {
    return {
      status: "error",
      message: "El nombre debe tener entre 1 y 80 caracteres.",
    };
  }
  if (bio.length > 280) {
    return { status: "error", message: "La bio supera los 280 caracteres." };
  }
  if (instagram && !INSTAGRAM_RE.test(instagram)) {
    return {
      status: "error",
      message:
        "Handle de Instagram inválido. Solo letras, números, puntos y guión bajo (sin @).",
    };
  }

  const { error } = await supabase
    .from("users")
    .update({
      username,
      display_name: displayName,
      bio: bio || null,
      city: city || null,
      instagram_handle: instagram || null,
      avatar_url: avatarUrl || null,
      cover_url: coverUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    // Likely a unique-violation on username.
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Ese username ya está tomado. Probá otro.",
      };
    }
    console.error("[updateProfile]", error);
    return {
      status: "error",
      message: error.message ?? "No se pudo guardar.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
