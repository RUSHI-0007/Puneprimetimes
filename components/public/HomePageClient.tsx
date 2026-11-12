'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/language-context';
import ArticleCard from '@/components/public/ArticleCard';
import HighlightNewsCarousel from '@/components/public/HighlightNewsCarousel';
import NewsBureauSection from '@/components/public/NewsBureauSection';
import type { Article, Category } from '@/lib/types';
import { Newspaper, Sparkles, TrendingUp, Layers } from 'lucide-react';

interface HomePageClientProps {
  articles: (Article & { category?: Category | null })[];
  categories: Category[];
}

export default function HomePageClient({ articles, categories }: HomePageClientProps) {
  const { language, t } = useLanguage();

  // Filter articles by active language, with fallback to all articles if none yet published in that language
  const filteredArticles = useMemo(() => {
    const langMatches = articles.filter((a) => {
      const artLang = a.language || 'mr';
      return artLang === language;
    });

    if (langMatches.length > 0) {
      return langMatches;
    }
    // If no articles match the selected language, show all published articles so the site isn't blank
    return articles;
  }, [articles, language]);

  // Identify Featured Hero article
  const featuredArticle =
    filteredArticles.find((a) => a.is_featured) || filteredArticles[0] || null;

  // Remaining articles
  const remainingArticles = featuredArticle
    ? filteredArticles.filter((a) => a.id !== featuredArticle.id)
    : filteredArticles;

  const topDispatches = remainingArticles.slice(0, 4);
  const feedArticles = remainingArticles.slice(4);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* If No Articles at all */}
      {filteredArticles.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
            <Newspaper className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white">
            {t.noStoriesTitle}
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {t.noStoriesDesc}
          </p>
          <div className="pt-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-sm"
            >
              {t.signInDesk} &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 1. Hero & Top Dispatches Section */}
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Main Featured Hero (Col 8) */}
              {featuredArticle && (
                <div className="lg:col-span-8">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    <Sparkles className="w-4 h-4 fill-red-600" />
                    {t.topStory}
                  </div>
                  <ArticleCard article={featuredArticle} variant="hero" />
                </div>
              )}

              {/* Side Column: Trending Dispatches (Col 4) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  {t.trendingDispatches}
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {topDispatches.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="compact"
                    />
                  ))}
                  {topDispatches.length === 0 && (
                    <p className="text-xs text-neutral-400 py-4 italic">
                      {language === 'mr' ? 'अधिक बातम्या लवकरच येत आहेत.' : 'More stories coming soon.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Apple Cards Carousel: Highlight & Breaking News Focus */}
          {filteredArticles.length > 1 && (
            <HighlightNewsCarousel articles={filteredArticles} />
          )}

          {/* 3. Category Filter Chips */}
          <section className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-red-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                {t.allBeats}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Link
                href="/"
                className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
              >
                {t.allStories}
              </Link>
              {categories.map((c) => {
                const localizedName = language === 'mr' && t.categories[c.slug] ? t.categories[c.slug] : c.name;
                return (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {localizedName}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 4. Latest Articles Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-900 dark:text-white">
                {t.latestCoverage}
              </h2>
              <span className="text-xs text-neutral-400 font-medium">
                {language === 'mr' ? `${filteredArticles.length} बातम्या प्रदर्शित` : `Showing ${filteredArticles.length} published stories`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {(feedArticles.length > 0 ? feedArticles : filteredArticles).map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="standard"
                />
              ))}
            </div>
          </section>

          {/* 5. 3D Interactive News Bureau & Location Globe */}
          <NewsBureauSection />
        </>
      )}
    </div>
  );
}

