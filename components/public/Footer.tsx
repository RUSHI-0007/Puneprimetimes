import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import type { Category } from '@/lib/types';
import { Newspaper, ShieldCheck } from 'lucide-react';

interface FooterProps {
  categories: Category[];
}

export default function Footer({ categories }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                <Newspaper className="w-5 h-5" />
              </div>
              <span className="font-serif font-black text-2xl text-white tracking-tight">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-sm text-neutral-400 max-w-md leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="pt-2 text-xs text-neutral-400">
              <span className="font-bold text-neutral-300">Editorial Office:</span> FC Road & Shivajinagar, Pune, Maharashtra 411005
            </div>
          </div>

          {/* Section Directory */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Sections & Coverage
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-white transition-colors"
                >
                  All Latest News
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Standards & Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Journalistic Standards
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Committed to independent, verified reporting free of corporate or political bias. Uncompromising fact-checking for every dispatch.
            </p>
            <div className="pt-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                Staff Editorial Desk
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {currentYear} {siteConfig.name}. All rights reserved.</p>
          <p>Powered by Next.js & Supabase</p>
        </div>
      </div>
    </footer>
  );
}
