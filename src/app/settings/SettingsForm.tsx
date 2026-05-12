"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { updateProfile, type SettingsState } from "./actions";

const INITIAL_STATE: SettingsState = { status: "idle" };

type Props = {
  initialDisplayName: string;
  initialUsername: string;
  initialBio: string;
  initialCity: string;
  email: string;
};

export function SettingsForm({
  initialDisplayName,
  initialUsername,
  initialBio,
  initialCity,
  email,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <Field label="Nombre" hint="Lo que ven los demás en tu perfil." required>
        <input
          name="display_name"
          type="text"
          required
          minLength={1}
          maxLength={80}
          defaultValue={initialDisplayName}
          autoComplete="name"
          placeholder="Benja Cueros Valiz"
          className={inputCls}
        />
      </Field>

      <Field
        label="Username"
        hint="Tu handle en el Atlas. Minúsculas, números y guión bajo. Entre 3 y 30 caracteres."
        required
      >
        <input
          name="username"
          type="text"
          required
          minLength={3}
          maxLength={30}
          pattern="^[a-z0-9_]+$"
          defaultValue={initialUsername}
          autoComplete="username"
          placeholder="benja"
          className={inputCls}
        />
      </Field>

      <Field label="Bio" hint="Una línea sobre ti. Máximo 280 caracteres.">
        <textarea
          name="bio"
          maxLength={280}
          rows={2}
          defaultValue={initialBio}
          placeholder="Outdoorsy, snowboarder, café-amateur."
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Field label="Ciudad" hint="Opcional. Ayuda a otros a ubicarte.">
        <input
          name="city"
          type="text"
          maxLength={80}
          defaultValue={initialCity}
          autoComplete="address-level2"
          placeholder="Santiago"
          className={inputCls}
        />
      </Field>

      <Field label="Correo" hint="No editable desde acá. Asociado a tu cuenta.">
        <input
          type="email"
          value={email}
          disabled
          readOnly
          className={`${inputCls} opacity-50`}
        />
      </Field>

      {state.status === "error" && (
        <p className="font-mono text-xs text-destructive">{state.message}</p>
      )}

      <div className="flex justify-end border-t border-border pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-background hover:bg-foreground/80 transition-colors disabled:opacity-30"
        >
          {isPending ? (
            <>
              Guardando
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            </>
          ) : (
            <>
              Guardar cambios
              <ArrowRight className="h-3 w-3" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full border-b border-border bg-transparent py-3 text-base placeholder:text-foreground/30 focus:border-foreground focus:outline-none transition-colors disabled:opacity-50";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
        {hint}
      </p>
    </div>
  );
}
