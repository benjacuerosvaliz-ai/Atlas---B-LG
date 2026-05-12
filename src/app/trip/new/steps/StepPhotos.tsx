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
      setError(`Máximo ${MAX_PHOTOS} fotos por viaje.`);
      return;
    }
    const toUpload = list.slice(0, remaining).filter((f) => {
      if (!f.type.startsWith("image/")) {
        setError("Solo imágenes (JPG, PNG, HEIC).");
        return false;
      }
      if (f.size > MAX_BYTES) {
        setError(`Cada foto debe pesar menos de 10 MB. "${f.name}" se pasa.`);
        return false;
      }
      return true;
    });

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
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed py-12 px-6 transition-colors",
          isDragging
            ? "border-foreground bg-foreground/[0.04]"
            : "border-border hover:border-foreground/60",
        )}
      >
        <ImageIcon className="h-6 w-6 text-foreground/50" aria-hidden />
        <p className="text-center text-sm text-foreground/70">
          Arrastra tus fotos o haz click para elegir
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/40">
          {data.photos.length} / {MAX_PHOTOS} subidas
          {uploading > 0 && ` · ${uploading} en cola`}
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

      {error && <p className="font-mono text-xs text-destructive">{error}</p>}

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
