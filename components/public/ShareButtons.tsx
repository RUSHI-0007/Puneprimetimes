'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Share2, Link as LinkIcon, Check, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface ShareButtonsProps {
  title: string;
  url: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
}

export default function ShareButtons({ title, url, excerpt }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();

  // Normalize URL to always use canonical HTTPS www in production so WhatsApp crawler never gets 308 redirect
  const cleanUrl = url
    .replace(/^https?:\/\/localhost(:\d+)?/, 'https://www.puneprimetimes.in')
    .replace(/^https?:\/\/puneprimetimes\.in/, 'https://www.puneprimetimes.in');

  // Formatted WhatsApp message: Bold headline + Link to full story + Tagline
  const whatsappMessage =
    language === 'mr'
      ? `*${title}*\n\n${excerpt ? `${excerpt}\n\n` : ''}📍 *सविस्तर बातमी वाचा:*\n${cleanUrl}\n\n📰 *पुणे प्राईम टाईम्स* | सत्य. वेग. विश्वास.`
      : `*${title}*\n\n${excerpt ? `${excerpt}\n\n` : ''}📍 *Read Full Story:*\n${cleanUrl}\n\n📰 *Pune Prime Times* | Truth. Speed. Insight.`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(cleanUrl);
      setCopied(true);
      toast.success(language === 'mr' ? 'बातमीची लिंक कॉपी झाली!' : 'Link copied to clipboard!');
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
          text: whatsappMessage,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(cleanUrl)}`;

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 mr-0.5 sm:mr-1 flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Share</span>
      </span>

      {/* WhatsApp Share Button */}
      <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white shadow-sm transition-all touch-manipulation"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5 fill-white flex-shrink-0" />
        <span>WhatsApp</span>
      </a>

      {/* Twitter / X Share Button */}
      <a
        href={twitterShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white dark:bg-white dark:text-neutral-900 shadow-sm transition-all touch-manipulation"
        title="Share on X"
      >
        <span>𝕏 Post</span>
      </a>

      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 active:scale-95 transition-all touch-manipulation"
        title="Copy article link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      {/* Mobile Native Share Sheet (if supported) */}
      <button
        type="button"
        onClick={handleNativeShare}
        className="md:hidden inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 active:scale-95 transition-all touch-manipulation"
      >
        More...
      </button>
    </div>
  );
}
