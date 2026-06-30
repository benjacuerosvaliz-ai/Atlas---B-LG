"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = {
  status: "idle" | "error";
  message?: string;
};

/**
 * Eliminar cuenta. Server action invocada desde Settings.
 *
 * Flujo:
 *  1. Verifica sesión (auth.uid()).
 *  2. Lee el username confirmado por el usuario en el formulario.
 *  3. Compara contra el username actual en la tabla `users`. Si no matchea,
 *     no borra nada (defensa contra clicks accidentales).
 *  4. Cierra la sesión del cliente (cookies) ANTES del borrado, porque
 *     una vez eliminada la fila de auth.users la sesión queda huérfana.
 *  5. Borra el usuario de auth.users via admin client. El CASCADE de la
 *     tabla `users` (FK con on delete cascade) borra perfil, viajes,
 *     ciudades, equipaje, etc.
 *  6. Redirige a "/".
 */
export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Tu sesión expiró." };
  }

  const typedUsername = String(formData.get("confirm_username") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!typedUsername) {
    return {
      status: "error",
      message: "Escribe tu username para confirmar.",
    };
  }

  // Verificar contra el username actual del usuario autenticado.
  const { data: profile, error: profileErr } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile?.username) {
    console.error("[deleteAccount] no profile", profileErr);
    return {
      status: "error",
      message: "No pudimos verificar tu cuenta. Reintenta.",
    };
  }

  if (profile.username.toLowerCase() !== typedUsername) {
    return {
      status: "error",
      message: "El username no coincide con el de tu cuenta.",
    };
  }

  // Cerramos la sesión local primero — una vez borrado el auth.user, los
  // refresh tokens quedan inválidos y la cookie igual sería basura.
  await supabase.auth.signOut();

  // Borrar de auth.users vía service_role. El CASCADE de public.users
  // arrastra viajes, ciudades conquistadas, equipaje, etc.
  const admin = createAdminClient();
  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);

  if (deleteErr) {
    console.error("[deleteAccount] admin.deleteUser", deleteErr);
    return {
      status: "error",
      message:
        "No pudimos borrar la cuenta. Escríbenos a hola@bolg.cl y lo hacemos a mano.",
    };
  }

  redirect("/");
}
