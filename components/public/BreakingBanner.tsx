import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';
import type { Article } from '@/lib/types';

interface BreakingBannerProps {
  breakingArticle?: Article | null;
}

export default function BreakingBanner({ breakingArticle }: BreakingBannerProps) {
  if (!breakingArticle) return null;

  return (
    <div className="bg-red-600 text-white text-xs sm:text-sm font-medium py-2 sm:py-2.5 px-3 sm:px-6 lg:px-8 border-b border-red-700 shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white text-red-700 animate-pulse shadow-sm">
            <Flame className="w-3 h-3 fill-red-600" />
            <span className="sm:inline hidden">Breaking News</span>
            <span className="sm:hidden inline">Breaking</span>
          </span>
          <Link
            href={`/news/${breakingArticle.slug}`}
            className="truncate hover:underline font-semibold text-xs sm:text-sm"
          >
            {breakingArticle.title}
          </Link>
        </div>

        <Link
          href={`/news/${breakingArticle.slug}`}
          className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold hover:opacity-80 transition-opacity bg-red-700/60 px-2 py-0.5 rounded-md sm:bg-transparent sm:p-0"
        >
          Read <span className="hidden sm:inline">Story</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </Link>
      </div>
    </div>
  );
}
