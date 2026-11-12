'use client';

import { useLanguage } from '@/lib/i18n/language-context';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-0.5 text-xs font-semibold ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage('mr')}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
          language === 'mr'
            ? 'bg-red-600 text-white shadow-sm font-bold'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        <span>मराठी</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
          language === 'en'
            ? 'bg-red-600 text-white shadow-sm font-bold'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        <span>English</span>
      </button>
    </div>
  );
}

