import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import CategoryNav from './CategoryNav';
import type { Category } from '@/lib/types';
import { ShieldCheck, Calendar } from 'lucide-react';

interface HeaderProps {
  categories: Category[];
  activeCategorySlug?: string;
}

export default function Header({ categories, activeCategorySlug }: HeaderProps) {
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      {/* Top Thin Meta Bar */}
      <div className="border-b border-neutral-100 dark:border-neutral-900 text-[11px] text-neutral-500 py-1.5 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">{todayFormatted}</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="italic whitespace-nowrap">Pune Edition</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <span className="hidden md:inline font-semibold text-neutral-400 tracking-wider text-[11px]">
              {siteConfig.tagline}
            </span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 transition-colors py-0.5 px-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-900"
              title="Staff Editorial Desk"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden xs:inline">Staff Desk</span>
              <span className="xs:hidden">Desk</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Masthead Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex flex-col items-center justify-center text-center">
        <Link href="/" className="inline-block group">
          <h1 className="text-2xl min-[400px]:text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-neutral-950 dark:text-white uppercase transition-colors group-hover:text-red-700">
            {siteConfig.name}
          </h1>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
            <span className="h-px w-6 sm:w-12 bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
            <p className="text-[9px] min-[400px]:text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
              Independent Journalism for Pune & Beyond
            </p>
            <span className="h-px w-6 sm:w-12 bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />
          </div>
        </Link>
      </div>

      {/* Category Navigation Bar (Sticky on Scroll) */}
      <CategoryNav categories={categories} activeCategorySlug={activeCategorySlug} />
    </header>
  );
}
