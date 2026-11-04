'use client';

import Link from 'next/link';
import type { Category } from '@/lib/types';

interface CategoryNavProps {
  categories: Category[];
  activeCategorySlug?: string;
}

export default function CategoryNav({
  categories,
  activeCategorySlug,
}: CategoryNavProps) {
  return (
    <nav className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center overflow-x-auto no-scrollbar py-2 sm:py-2.5 gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-medium">
          {/* Home / All */}
          <Link
            href="/"
            className={`whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-full transition-all flex-shrink-0 text-xs sm:text-sm ${
              !activeCategorySlug
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            All Stories
          </Link>

          {/* Category Links */}
          {categories.map((category) => {
            const isActive = activeCategorySlug === category.slug;
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={`whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-full transition-all flex-shrink-0 text-xs sm:text-sm ${
                  isActive
                    ? 'bg-red-600 text-white font-semibold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
