'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Share2, Link as LinkIcon, Check, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${title}\n\nRead more at: ${url}`
  )}`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 mr-1 flex items-center gap-1.5">
        <Share2 className="w-3.5 h-3.5" />
        Share
      </span>

      {/* WhatsApp Share Button */}
      <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm transition-all"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5 fill-white" />
        WhatsApp
      </a>

      {/* Twitter / X Share Button */}
      <a
        href={twitterShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 shadow-sm transition-all"
        title="Share on X"
      >
        <span>𝕏 Post</span>
      </a>

      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors"
        title="Copy article link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Copied!
          </>
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5" />
            Copy Link
          </>
        )}
      </button>

      {/* Mobile Native Share Sheet (if supported) */}
      <button
        type="button"
        onClick={handleNativeShare}
        className="md:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
      >
        More...
      </button>
    </div>
  );
}

