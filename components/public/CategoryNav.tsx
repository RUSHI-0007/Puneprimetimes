'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/language-context';
import type { Category } from '@/lib/types';

interface CategoryNavProps {
  categories: Category[];
  activeCategorySlug?: string;
}

export default function CategoryNav({
  categories,
  activeCategorySlug: propActiveCategorySlug,
}: CategoryNavProps) {
  const { language, t } = useLanguage();
  const pathname = usePathname();

  // Detect active category slug: from props OR by inspecting current URL pathname (/category/[slug])
  let activeCategorySlug = propActiveCategorySlug;
  if (!activeCategorySlug && pathname?.startsWith('/category/')) {
    const raw = pathname.replace('/category/', '').split('/')[0];
    try {
      activeCategorySlug = decodeURIComponent(raw);
    } catch {
      activeCategorySlug = raw;
    }
  }

  // "All Stories" is active ONLY on the root page ('/') when no specific category is selected
  const isHomeActive = !activeCategorySlug && (pathname === '/' || pathname === '');

  const activePillClasses =
    'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-sm';
  const inactivePillClasses =
    'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 font-medium';

  return (
    <nav className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center overflow-x-auto no-scrollbar py-2 sm:py-2.5 gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-medium">
          {/* Home / All */}
          <Link
            href="/"
            className={`whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-full transition-all flex-shrink-0 text-xs sm:text-sm ${
              isHomeActive ? activePillClasses : inactivePillClasses
            }`}
          >
            {t.allStories}
          </Link>

          {/* Category Links */}
          {categories.map((category) => {
            const isActive = activeCategorySlug === category.slug;
            const categoryName =
              language === 'mr' && t.categories[category.slug]
                ? t.categories[category.slug]
                : category.name;

            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={`whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-full transition-all flex-shrink-0 text-xs sm:text-sm ${
                  isActive ? activePillClasses : inactivePillClasses
                }`}
              >
                {categoryName}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
