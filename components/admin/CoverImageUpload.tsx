'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { uploadNewsImage } from '@/lib/utils/image-compression';
import { toast } from 'sonner';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface CoverImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
}

export default function CoverImageUpload({ value, onChange }: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Optimizing and uploading image...');

    try {
      const supabase = createClient();
      const result = await uploadNewsImage(file, supabase, 'covers');
      onChange(result.url);
      toast.success('Cover image uploaded successfully', { id: toastId });
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(`Upload error: ${err.message || 'Failed to upload'}`, { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    try {
      new URL(manualUrl);
      onChange(manualUrl.trim());
      setShowUrlInput(false);
      setManualUrl('');
      toast.success('Image URL set');
    } catch {
      toast.error('Please enter a valid HTTP/HTTPS URL');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
          Cover Image
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          {showUrlInput ? 'Upload file instead' : 'Or paste image URL'}
        </button>
      </div>

      {showUrlInput && (
        <form onSubmit={handleManualUrlSubmit} className="flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
          >
            Apply
          </button>
        </form>
      )}

      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 aspect-[16/9] w-full max-h-[340px]">
          <Image
            src={value}
            alt="Article cover preview"
            fill
            className="object-cover transition-transform group-hover:scale-102"
            sizes="(max-width: 768px) 100vw, 700px"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/90 text-neutral-900 text-xs font-semibold hover:bg-white shadow"
            >
              Change Image
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow"
              title="Remove Cover Image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-neutral-50/50 dark:bg-neutral-900/50 group"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3 text-neutral-600 dark:text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-xs font-medium">Compressing & uploading to storage...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-red-600 group-hover:bg-red-50 dark:group-hover:bg-red-950/40 flex items-center justify-center transition-colors mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Click to upload cover photo
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Auto-compressed to under 500KB (JPG, PNG, WebP)
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

