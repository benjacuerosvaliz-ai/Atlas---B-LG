"use client";

import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { uploadToCloudinary, type UploadedAsset } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import type { TripFormData } from "../types";

// One photo per trip. Keeps the Atlas clean (one image per pin) and the
// upload flow snappy. If we ever want a gallery view, this becomes >1.
const MAX_PHOTOS = 1;
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
      setError(
        "Ya subiste tu foto. Elimínala si quieres cambiarla por otra.",
      );
      return;
    }
    if (list.length > remaining) {
      setError(
        `Elegiste ${list.length} fotos pero solo puedes subir 1 por viaje. Elige una sola.`,
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
        setError(`La foto debe pesar menos de 10 MB. "${f.name}" se pasa.`);
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
        setError("La foto no se pudo subir. Reintenta.");
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

  const hasPhoto = data.photos.length > 0;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
          La evidencia
        </span>
        <h2 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl">
          La foto que cuenta.
        </h2>
        <p className="max-w-md text-base leading-relaxed text-foreground/60">
          Una sola, máx 10 MB. Opcional pero recomendado — el Atlas se ve
          mejor con imágenes que sin. Es la que aparecerá sobre el mapa.
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
              Subiendo tu foto...
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/55">
              No cierres esta ventana
            </span>
          </div>
        </div>
      )}

      {!hasPhoto && (
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
            Arrastra tu foto o haz click para elegir
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/40">
            Una sola, la que mejor represente el viaje
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="border-l-2 border-destructive bg-destructive/[0.06] px-4 py-3 font-mono text-xs leading-relaxed text-destructive"
        >
          {error}
        </p>
      )}

      {hasPhoto && (
        <div className="flex flex-col gap-2">
          <div className="group relative max-w-sm overflow-hidden bg-fog">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.photos[0].url}
              alt=""
              className="h-auto w-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => remove(data.photos[0].publicId)}
              className="absolute top-2 right-2 grid h-9 w-9 place-items-center bg-ink/80 text-bone hover:bg-ink transition-colors"
              aria-label="Eliminar foto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/40">
            Foto guardada · click la X para cambiarla
          </span>
        </div>
      )}
    </div>
  );
}
