import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import CategoryNav from './CategoryNav';
import type { Category } from '@/lib/types';
import { ShieldCheck, Calendar, Clock } from 'lucide-react';

interface HeaderProps {
  categories: Category[];
  activeCategorySlug?: string;
}

export default function Header({ categories, activeCategorySlug }: HeaderProps) {
  // Today's date in Indian editorial format
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      {/* Top Thin Meta Bar */}
      <div className="border-b border-neutral-100 dark:border-neutral-900 text-[11px] text-neutral-500 py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-medium">{todayFormatted}</span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="hidden sm:inline italic">Pune Edition</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline font-semibold text-neutral-400 tracking-wider">
              {siteConfig.tagline}
            </span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-red-600 transition-colors"
              title="Editorial Staff Access"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Staff Desk
            </Link>
          </div>
        </div>
      </div>

      {/* Main Masthead Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 md:py-7 flex flex-col items-center justify-center text-center">
        <Link href="/" className="inline-block group">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-neutral-950 dark:text-white uppercase transition-colors group-hover:text-red-700">
            {siteConfig.name}
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500 mt-1">
            Independent Journalism for Pune & Beyond
          </p>
        </Link>
      </div>

      {/* Category Navigation Bar (Sticky on Scroll) */}
      <CategoryNav categories={categories} activeCategorySlug={activeCategorySlug} />
    </header>
  );
}
