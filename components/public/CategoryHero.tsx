'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/language-context';
import type { Category } from '@/lib/types';
import { Layers, Newspaper } from 'lucide-react';

interface CategoryHeroProps {
  category: Category;
}

export function CategoryHero({ category }: CategoryHeroProps) {
  const { language, t } = useLanguage();

  const localizedName =
    language === 'mr' && t.categories[category.slug]
      ? t.categories[category.slug]
      : category.name;

  return (
    <div className="py-5 sm:py-8 border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-1.5 sm:mb-2">
        <Layers className="w-4 h-4" />
        {language === 'mr' ? 'न्यूज बीट' : 'News Beat'}
      </div>
      <h1 className="text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl font-serif font-black text-neutral-900 dark:text-white">
        {localizedName}
      </h1>
      <p className="text-xs sm:text-base text-neutral-500 dark:text-neutral-400 mt-1.5 sm:mt-2 max-w-2xl leading-relaxed">
        {language === 'mr'
          ? `पुणे आणि परिसरासाठी '${localizedName}' अंतर्गत संपूर्ण विश्वासार्ह आणि ताज्या घडामोडी.`
          : `Complete verified coverage and breaking updates under ${category.name} for Pune and surrounding regions.`}
      </p>
    </div>
  );
}

export function CategoryEmptyState() {
  const { language, t } = useLanguage();

  return (
    <div className="py-16 text-center max-w-md mx-auto space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
        <Newspaper className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
        {language === 'mr'
          ? 'या विभागात अद्याप कोणतीही बातमी प्रसिद्ध झालेली नाही'
          : 'No published stories in this beat yet'}
      </h3>
      <p className="text-xs text-neutral-500">
        {language === 'mr'
          ? 'आमचे वृत्तकक्ष घडामोडींचा मागोवा घेत आहे. कृपया लवकरच पुन्हा तपासा.'
          : 'Our newsroom is tracking developing events. Check back shortly.'}
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="text-xs font-semibold text-red-600 hover:underline"
        >
          &larr; {language === 'mr' ? 'सर्व बातम्यांकडे परत जा' : 'Return to All Stories'}
        </Link>
      </div>
    </div>
  );
}
