import { supabase } from './supabase';
import { getCurrentUser } from './cloudSync';
import { generateId } from '../utils/uuid';

const BUCKET = 'notebook-images';
const MAX_FILE_SIZE_MB = 8;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export type UploadResult =
  | { success: true; url: string; path: string }
  | { success: false; error: string };

/**
 * Validate a file before uploading
 */
export function validateImageFile(file: File): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported file type. Please use PNG, JPG, JPEG, or WEBP.` };
  }
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    return { valid: false, error: `Image is too large (${sizeMB.toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.` };
  }
  return { valid: true };
}

/**
 * Upload an image file to Supabase Storage.
 * Organises files as: user_id/notebook_id/unique-name.ext
 * Returns the public URL for the image.
 */
export async function uploadNotebookImage(
  file: File,
  notebookId: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be signed in to upload images.' };
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: (validation as any).error };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const uniqueName = `${generateId()}.${ext}`;
  const storagePath = `${user.id}/${notebookId}/${uniqueName}`;

  // Simulate early progress (Supabase JS SDK v2 doesn't stream progress natively)
  onProgress?.(10);

  try {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    onProgress?.(80);

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get a public URL (bucket must be public)
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    onProgress?.(100);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Could not get image URL after upload.' };
    }

    return { success: true, url: urlData.publicUrl, path: storagePath };
  } catch (err: any) {
    console.error('Unexpected upload error:', err);
    return { success: false, error: err?.message || 'Unexpected error during upload.' };
  }
}

/**
 * Read a file as a base64 data URL (fallback when bucket is not available)
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

