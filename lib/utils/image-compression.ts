import imageCompression from 'browser-image-compression';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ImageUploadResult {
  url: string;
  path: string;
  sizeBytes: number;
}

/**
 * Compresses an image file in the browser to max ~1600px dimension and under 500KB.
 */
export async function compressNewsImage(imageFile: File): Promise<File> {
  const options = {
    maxSizeMB: 0.48, // ~500 KB limit
    maxWidthOrHeight: 1600, // Max dimension 1600px
    useWebWorker: true,
    fileType: 'image/webp', // Standard modern format
  };

  try {
    const compressedBlob = await imageCompression(imageFile, options);
    // Maintain a clean WebP filename
    const baseName = imageFile.name.replace(/\.[^/.]+$/, '');
    return new File([compressedBlob], `${baseName}.webp`, {
      type: 'image/webp',
    });
  } catch (error) {
    console.warn('Image compression fallback to original file:', error);
    return imageFile;
  }
}

/**
 * Compresses and uploads an image to the Supabase 'news-images' storage bucket.
 * Returns the public URL and storage path.
 */
export async function uploadNewsImage(
  file: File,
  supabase: SupabaseClient,
  folder = 'articles'
): Promise<ImageUploadResult> {
  // 1. Client-side compression
  const compressedFile = await compressNewsImage(file);

  // 2. Generate a collision-resistant clean filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);

  const filePath = `${folder}/${timestamp}-${cleanBaseName}-${randomSuffix}.webp`;

  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('news-images')
    .upload(filePath, compressedFile, {
      cacheControl: '31536000', // 1 year cache for static media
      upsert: false,
      contentType: 'image/webp',
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // 4. Retrieve public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('news-images').getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
    sizeBytes: compressedFile.size,
  };
}
