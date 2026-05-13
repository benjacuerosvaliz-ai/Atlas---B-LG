import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Append a Cloudinary transformation segment to an /image/upload URL.
 * Returns the original URL untouched if it's not a recognized Cloudinary
 * delivery URL. Use for cheap on-the-fly resizing/cropping (e.g. delivering
 * a 200×200 square thumbnail for globe markers instead of the full upload).
 */
export function cloudinaryTransform(url: string, transform: string): string {
  if (!url) return url;
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return url.slice(0, idx + marker.length) + transform + "/" + url.slice(idx + marker.length);
}
