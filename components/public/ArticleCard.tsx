'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatTimeAgo, formatDate } from '@/lib/utils/format-date';
import { useLanguage } from '@/lib/i18n/language-context';
import type { Article, Category } from '@/lib/types';
import { Flame, Clock } from 'lucide-react';

interface ArticleCardProps {
  article: Article & { category?: Category | null };
  variant?: 'hero' | 'standard' | 'compact';
}

export default function ArticleCard({
  article,
  variant = 'standard',
}: ArticleCardProps) {
  const { language, t } = useLanguage();
  const publishedDate = article.published_at || article.created_at;

  const flags = article.flags as Record<string, any> | undefined;

  // Language-aware Title & Excerpt
  const displayTitle =
    language === 'en' && flags?.title_en
      ? flags.title_en
      : article.title;

  const displayExcerpt =
    language === 'en' && flags?.excerpt_en
      ? flags.excerpt_en
      : article.excerpt;

  // Localized Category Name
  const categoryName = article.category
    ? language === 'mr' && t.categories[article.category.slug]
      ? t.categories[article.category.slug]
      : article.category.name
    : null;

  // HERO VARIANT (Featured Spotlight)
  if (variant === 'hero') {
    return (
      <article className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-900 text-white shadow-lg sm:shadow-xl">
        <Link href={`/news/${article.slug}`} className="block">
          <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[21/9] w-full overflow-hidden">
            {article.cover_image_url ? (
              <Image
                src={article.cover_image_url}
                alt={displayTitle}
                fill
                priority
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.88] group-hover:brightness-100"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-neutral-900 via-neutral-800 to-red-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 sm:via-black/45 to-transparent" />
          </div>

          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-7 md:p-9 space-y-2 sm:space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {article.is_breaking && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
                  <Flame className="w-3 h-3 fill-white" />
                  {language === 'mr' ? 'ब्रेकिंग' : 'Breaking'}
                </span>
              )}
              {categoryName && (
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/10">
                  {categoryName}
                </span>
              )}
              <span className="text-[11px] sm:text-xs text-neutral-300 flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {formatTimeAgo(publishedDate)}
              </span>
            </div>

            <h2 className="text-lg min-[400px]:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-black leading-tight sm:leading-snug group-hover:text-red-400 transition-colors line-clamp-2 sm:line-clamp-3">
              {displayTitle}
            </h2>

            {displayExcerpt && (
              <p className="text-xs sm:text-sm md:text-base text-neutral-300 line-clamp-2 max-w-3xl font-normal leading-relaxed hidden sm:block">
                {displayExcerpt}
              </p>
            )}
          </div>
        </Link>
      </article>
    );
  }

  // COMPACT VARIANT (for sidebars or dense lists)
  if (variant === 'compact') {
    return (
      <article className="group flex items-start gap-3 sm:gap-4 py-3 sm:py-3.5">
        {article.cover_image_url && (
          <Link
            href={`/news/${article.slug}`}
            className="relative w-20 h-16 min-[400px]:w-24 min-[400px]:h-20 sm:w-28 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-800"
          >
            <Image
              src={article.cover_image_url}
              alt={displayTitle}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="112px"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          {categoryName && (
            <Link
              href={`/category/${article.category?.slug}`}
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:underline"
            >
              {categoryName}
            </Link>
          )}
          <h3 className="font-serif font-bold text-xs sm:text-sm md:text-base text-neutral-900 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
            <Link href={`/news/${article.slug}`}>{displayTitle}</Link>
          </h3>
          <span className="text-[10px] sm:text-[11px] text-neutral-400 block">
            {formatTimeAgo(publishedDate)}
          </span>
        </div>
      </article>
    );
  }

  // STANDARD GRID CARD
  return (
    <article className="group flex flex-col bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
      <Link
        href={`/news/${article.slug}`}
        className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800"
      >
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={displayTitle}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center text-neutral-400 text-xs">
            {categoryName || 'News'}
          </div>
        )}
        {categoryName && (
          <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3">
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-white shadow-sm backdrop-blur">
              {categoryName}
            </span>
          </div>
        )}
      </Link>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-neutral-400">
            <span>{formatDate(publishedDate)}</span>
            <span>•</span>
            <span>{formatTimeAgo(publishedDate)}</span>
          </div>

          <h3 className="font-serif font-bold text-base sm:text-lg text-neutral-900 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
            <Link href={`/news/${article.slug}`}>{displayTitle}</Link>
          </h3>

          {displayExcerpt && (
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {displayExcerpt}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-red-600 dark:text-red-400">
          <Link
            href={`/news/${article.slug}`}
            className="hover:underline flex items-center gap-1"
          >
            {t.readStory} &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}
