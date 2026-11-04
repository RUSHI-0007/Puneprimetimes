'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-600">
            System Notice
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-neutral-900 dark:text-white">
            Temporary Newsroom Hiccup
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Our newsroom servers encountered an unexpected issue while retrieving this dispatch.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Story
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Front Page
          </Link>
        </div>
      </div>
    </div>
  );
}
