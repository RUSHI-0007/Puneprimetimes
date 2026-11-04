import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';
import type { Article } from '@/lib/types';

interface BreakingBannerProps {
  breakingArticle?: Article | null;
}

export default function BreakingBanner({ breakingArticle }: BreakingBannerProps) {
  if (!breakingArticle) return null;

  return (
    <div className="bg-red-600 text-white text-xs sm:text-sm font-medium py-2.5 px-4 sm:px-8 border-b border-red-700 shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-red-700 animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-red-600" />
            Breaking News
          </span>
          <Link
            href={`/news/${breakingArticle.slug}`}
            className="truncate hover:underline font-semibold"
          >
            {breakingArticle.title}
          </Link>
        </div>

        <Link
          href={`/news/${breakingArticle.slug}`}
          className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity ml-2"
        >
          Read <span className="hidden sm:inline">Story</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
