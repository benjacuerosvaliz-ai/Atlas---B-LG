"use client";

import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { uploadToCloudinary, type UploadedAsset } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import type { TripFormData } from "../types";

const MAX_PHOTOS = 5;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

type Props = {
  data: TripFormData;
  patch: (partial: Partial<TripFormData>) => void;
};

export function StepPhotos({ data, patch }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files);
    const remaining = MAX_PHOTOS - data.photos.length;
    if (remaining <= 0) {
      setError(`Ya tienes el máximo de ${MAX_PHOTOS} fotos. Elimina alguna antes de subir más.`);
      return;
    }
    // Don't silently drop the extras — tell the user clearly and abort so
    // they can re-pick exactly the ones they want. The native gallery on
    // iOS/Android doesn't enforce a count limit, so this is the only place
    // we can stop them.
    if (list.length > remaining) {
      setError(
        `Elegiste ${list.length} fotos pero solo puedes subir ${remaining} más (máximo ${MAX_PHOTOS} por viaje). Elige de nuevo seleccionando ${remaining} ${remaining === 1 ? "foto" : "fotos"}.`,
      );
      return;
    }
    const toUpload: File[] = [];
    for (const f of list) {
      if (!f.type.startsWith("image/")) {
        setError("Solo imágenes (JPG, PNG, HEIC).");
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(`Cada foto debe pesar menos de 10 MB. "${f.name}" se pasa.`);
        return;
      }
      toUpload.push(f);
    }

    setUploading(toUpload.length);
    const uploaded: UploadedAsset[] = [];
    for (const file of toUpload) {
      try {
        const asset = await uploadToCloudinary(file);
        uploaded.push(asset);
      } catch (err) {
        console.error("[upload]", err);
        setError("Una foto no se pudo subir. Reintenta.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (uploaded.length > 0) {
      patch({ photos: [...data.photos, ...uploaded] });
    }
  }

  function remove(publicId: string) {
    patch({ photos: data.photos.filter((p) => p.publicId !== publicId) });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
          La evidencia
        </span>
        <h2 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
          Las fotos que cuentan.
        </h2>
        <p className="max-w-md text-base leading-relaxed text-foreground/60">
          Hasta {MAX_PHOTOS} fotos, máx 10 MB cada una. Opcional pero
          recomendado — el Atlas se ve mejor con imágenes que sin.
        </p>
      </div>

      {uploading > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-4 border-2 border-foreground bg-foreground/[0.04] px-5 py-4"
        >
          <Loader2 className="h-6 w-6 shrink-0 animate-spin text-foreground" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              Subiendo {uploading} {uploading === 1 ? "foto" : "fotos"}...
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/55">
              No cierres esta ventana
            </span>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
        onClick={() => uploading === 0 && inputRef.current?.click()}
        aria-disabled={uploading > 0}
        className={cn(
          "flex flex-col items-center justify-center gap-3 border-2 border-dashed py-12 px-6 transition-colors",
          uploading > 0
            ? "cursor-not-allowed border-border opacity-50"
            : "cursor-pointer",
          isDragging
            ? "border-foreground bg-foreground/[0.04]"
            : uploading === 0 && "border-border hover:border-foreground/60",
        )}
      >
        <ImageIcon className="h-6 w-6 text-foreground/50" aria-hidden />
        <p className="text-center text-sm text-foreground/70">
          Arrastra tus fotos o haz click para elegir
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/40">
          {data.photos.length} / {MAX_PHOTOS} subidas
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="border-l-2 border-destructive bg-destructive/[0.06] px-4 py-3 font-mono text-xs leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      {data.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {data.photos.map((p) => (
            <div
              key={p.publicId}
              className="group relative aspect-square overflow-hidden bg-fog"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => remove(p.publicId)}
                className="absolute top-1 right-1 grid h-7 w-7 place-items-center bg-ink/80 text-bone opacity-0 transition-opacity hover:bg-ink group-hover:opacity-100"
                aria-label="Eliminar foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {uploading > 0 &&
            Array.from({ length: uploading }).map((_, i) => (
              <div
                key={`up-${i}`}
                className="grid aspect-square place-items-center border border-dashed border-border"
              >
                <Loader2 className="h-5 w-5 animate-spin text-foreground/50" />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
