"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = {
  status: "idle" | "error";
  message?: string;
};

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

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

  const { error } = await supabase
    .from("users")
    .update({
      username,
      display_name: displayName,
      bio: bio || null,
      city: city || null,
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
