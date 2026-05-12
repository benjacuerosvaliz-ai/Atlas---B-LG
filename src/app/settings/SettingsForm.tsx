"use client";

import { ArrowRight, ImageOff, Loader2, Trash2 } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import { updateProfile, type SettingsState } from "./actions";

const INITIAL_STATE: SettingsState = { status: "idle" };
const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  initialDisplayName: string;
  initialUsername: string;
  initialBio: string;
  initialCity: string;
  initialInstagram: string;
  initialAvatarUrl: string;
  initialCoverUrl: string;
  email: string;
};

export function SettingsForm({
  initialDisplayName,
  initialUsername,
  initialBio,
  initialCity,
  initialInstagram,
  initialAvatarUrl,
  initialCoverUrl,
  email,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    INITIAL_STATE,
  );

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File, kind: "avatar" | "cover") {
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Solo imágenes (JPG, PNG, HEIC).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("La foto debe pesar menos de 10 MB.");
      return;
    }
    setUploading(kind);
    try {
      const asset = await uploadToCloudinary(file);
      if (kind === "avatar") setAvatarUrl(asset.url);
      else setCoverUrl(asset.url);
    } catch (err) {
      console.error("[settings:upload]", err);
      setUploadError("La foto no se pudo subir. Reintenta.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <input type="hidden" name="cover_url" value={coverUrl} />

      {/* Avatar */}
      <Field
        label="Foto de perfil"
        hint="Cuadrada se ve mejor. Máximo 10 MB."
      >
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden border border-border bg-fog">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-foreground/30">
                <ImageOff className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading === "avatar"}
              className={cn(
                "flex items-center gap-2 self-start border border-border px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/80 hover:border-foreground hover:text-foreground transition-colors",
                uploading === "avatar" && "opacity-50",
              )}
            >
              {uploading === "avatar" ? (
                <>
                  Subiendo
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                </>
              ) : avatarUrl ? (
                "Cambiar foto"
              ) : (
                "Subir foto"
              )}
            </button>
            {avatarUrl && uploading !== "avatar" && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="flex items-center gap-1.5 self-start text-[10px] uppercase tracking-[0.24em] text-foreground/50 hover:text-foreground transition-colors"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
                Quitar
              </button>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file, "avatar");
              e.target.value = "";
            }}
          />
        </div>
      </Field>

      {/* Cover */}
      <Field
        label="Foto de portada"
        hint="Aparece arriba de tu perfil público. Horizontal se ve mejor."
      >
        <div className="flex flex-col gap-3">
          <div className="aspect-[3/1] w-full overflow-hidden border border-border bg-fog">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-foreground/30">
                <ImageOff className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading === "cover"}
              className={cn(
                "flex items-center gap-2 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-foreground/80 hover:border-foreground hover:text-foreground transition-colors",
                uploading === "cover" && "opacity-50",
              )}
            >
              {uploading === "cover" ? (
                <>
                  Subiendo
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                </>
              ) : coverUrl ? (
                "Cambiar portada"
              ) : (
                "Subir portada"
              )}
            </button>
            {coverUrl && uploading !== "cover" && (
              <button
                type="button"
                onClick={() => setCoverUrl("")}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-foreground/50 hover:text-foreground transition-colors"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
                Quitar
              </button>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file, "cover");
              e.target.value = "";
            }}
          />
        </div>
      </Field>

      {uploadError && (
        <p className="font-mono text-xs text-destructive">{uploadError}</p>
      )}

      <Field label="Nombre" hint="Tu nombre como quieres aparecer." required>
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
        label="Nombre de usuario"
        hint="Sin espacios. Solo minúsculas, números y guión bajo."
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

      <Field label="Ciudad" hint="Opcional. Para ubicarte en el mapa.">
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

      <Field
        label="Instagram"
        hint="Opcional. Tu nombre de Instagram, sin el @."
      >
        <input
          name="instagram_handle"
          type="text"
          maxLength={30}
          defaultValue={initialInstagram}
          placeholder="bolgconcept"
          className={inputCls}
        />
      </Field>

      <Field label="Correo" hint="No editable. Está asociado a tu cuenta.">
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
