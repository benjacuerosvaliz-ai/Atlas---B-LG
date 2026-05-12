/**
 * Browser-side helper to upload a File directly to Cloudinary using a
 * server-issued signature. Returns the canonical secure_url + public_id
 * so we can store them on trip_photos.
 *
 * The /api/cloudinary/sign endpoint validates the user is authenticated
 * and returns the signed params; this helper just does the upload.
 */

export type UploadedAsset = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
};

export async function uploadToCloudinary(file: File): Promise<UploadedAsset> {
  const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
  if (!signRes.ok) {
    throw new Error("Could not obtain upload signature");
  }
  const { signature, timestamp, folder, apiKey, cloudName } = await signRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }

  const data = await uploadRes.json();
  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    width: data.width as number,
    height: data.height as number,
    bytes: data.bytes as number,
  };
}
