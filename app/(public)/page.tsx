import { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/server';
import { siteConfig } from '@/lib/site-config';
import ArticleCard from '@/components/public/ArticleCard';
import HighlightNewsCarousel from '@/components/public/HighlightNewsCarousel';
import NewsBureauSection from '@/components/public/NewsBureauSection';
import { Highlighter } from '@/components/ui/highlighter';
import type { Article, Category } from '@/lib/types';
import { Newspaper, Sparkles, TrendingUp, Layers } from 'lucide-react';

export const revalidate = 60; // 60s ISR

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `${siteConfig.name} | Today's Top Stories & Pune Local News`,
    description: siteConfig.description,
    openGraph: {
      title: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.name,
      description: siteConfig.description,
    },
  };
}

export default async function HomePage() {
  const supabase = createPublicClient();

  // Fetch published articles with their category
  const [{ data: articles }, { data: categories }] = await Promise.all([
    supabase
      .from('articles')
      .select('*, category:categories(*)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(30),
    supabase.from('categories').select('*').order('name'),
  ]);

  const allArticles = (articles as (Article & { category?: Category | null })[]) || [];
  const allCategories = (categories as Category[]) || [];

  // Identify Featured Hero article
  const featuredArticle =
    allArticles.find((a) => a.is_featured) || allArticles[0] || null;

  // Remaining articles
  const remainingArticles = featuredArticle
    ? allArticles.filter((a) => a.id !== featuredArticle.id)
    : allArticles;

  const topDispatches = remainingArticles.slice(0, 4);
  const feedArticles = remainingArticles.slice(4);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* If No Articles at all */}
      {allArticles.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
            <Newspaper className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white">
            Editorial Desk In Progress
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Welcome to {siteConfig.name}. No stories have been published yet. Log in to the Editorial Desk to publish your first headline.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-sm"
            >
              Sign In to Staff Desk &rarr;
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
                    Top Story
                  </div>
                  <ArticleCard article={featuredArticle} variant="hero" />
                </div>
              )}

              {/* Side Column: Trending Dispatches (Col 4) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  Trending Dispatches
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
                      More stories coming soon.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Apple Cards Carousel: Highlight & Breaking News Focus */}
          {allArticles.length > 1 && (
            <HighlightNewsCarousel articles={allArticles} />
          )}

          {/* 3. Category Filter Chips */}
          <section className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-red-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Explore News Beats
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Link
                href="/"
                className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
              >
                All Beats
              </Link>
              {allCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-neutral-700 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>

          {/* 4. Latest Articles Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-900 dark:text-white">
                Latest Coverage
              </h2>
              <span className="text-xs text-neutral-400 font-medium">
                Showing {allArticles.length} published stories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {(feedArticles.length > 0 ? feedArticles : allArticles).map((article) => (
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
