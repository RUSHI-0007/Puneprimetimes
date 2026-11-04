import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/server';
import { siteConfig } from '@/lib/site-config';
import ArticleCard from '@/components/public/ArticleCard';
import type { Article, Category } from '@/lib/types';
import { ChevronLeft, ChevronRight, Layers, Newspaper } from 'lucide-react';

export const revalidate = 60; // 60s ISR

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    page?: string;
  };
}

const PAGE_SIZE = 9;

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const supabase = createPublicClient();

  const { data: category } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('slug', params.slug)
    .single();

  if (!category) {
    return {
      title: `Category Not Found | ${siteConfig.name}`,
    };
  }

  const title = `${category.name} News & Updates | ${siteConfig.name}`;
  const description = `Read the latest ${category.name} news, in-depth reports, and breaking updates from Pune and Maharashtra.`;
  const url = `${siteConfig.url}/category/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const supabase = createPublicClient();
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // 1. Fetch category
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (catError || !category) {
    notFound();
  }

  // 2. Fetch paginated articles
  const { data: articles, count, error: artError } = await supabase
    .from('articles')
    .select('*, category:categories(*)', { count: 'exact' })
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const articleList = (articles as (Article & { category?: Category | null })[]) || [];

  return (
    <div className="space-y-8">
      {/* Category Masthead */}
      <div className="py-6 sm:py-8 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-2">
          <Layers className="w-4 h-4" />
          News Beat
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-neutral-900 dark:text-white">
          {category.name}
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl">
          Complete verified coverage and breaking updates under {category.name} for Pune and surrounding regions.
        </p>
      </div>

      {/* Articles Grid or Empty State */}
      {articleList.length === 0 ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <Newspaper className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
            No published stories in this beat yet
          </h3>
          <p className="text-xs text-neutral-500">
            Our newsroom is tracking developing events. Check back shortly.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              &larr; Return to All Stories
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {articleList.map((art) => (
              <ArticleCard key={art.id} article={art} variant="standard" />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500">
                  Showing page <span className="font-semibold text-neutral-900 dark:text-white">{page}</span> of{' '}
                  <span className="font-semibold text-neutral-900 dark:text-white">{totalPages}</span> ({totalCount} articles)
                </p>
              </div>

              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={`/category/${category.slug}?page=${page - 1}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-300 dark:text-neutral-700 pointer-events-none">
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </span>
                )}

                {page < totalPages ? (
                  <Link
                    href={`/category/${category.slug}?page=${page + 1}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-300 dark:text-neutral-700 pointer-events-none">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

