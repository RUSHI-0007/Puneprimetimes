import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/server';
import { siteConfig } from '@/lib/site-config';
import { formatDate, formatDateTime, formatTimeAgo } from '@/lib/utils/format-date';
import RichTextRenderer from '@/components/public/RichTextRenderer';
import ShareButtons from '@/components/public/ShareButtons';
import ArticleCard from '@/components/public/ArticleCard';
import type { Article, Category } from '@/lib/types';
import { Clock, Calendar, ArrowLeft, Flame, Sparkles } from 'lucide-react';

export const revalidate = 60; // 60s ISR

interface NewsArticlePageProps {
  params: {
    slug: string;
  };
}

// Dynamic SEO Metadata for WhatsApp, Twitter, Google
export async function generateMetadata({
  params,
}: NewsArticlePageProps): Promise<Metadata> {
  const supabase = createPublicClient();

  const { data: article } = await supabase
    .from('articles')
    .select('title, excerpt, cover_image_url, slug, published_at')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!article) {
    return {
      title: `Article Not Found | ${siteConfig.name}`,
    };
  }

  const title = article.title;
  const description =
    article.excerpt || `${article.title} - Read full report on ${siteConfig.name}`;
  const articleUrl = `${siteConfig.url}/news/${article.slug}`;
  const ogImage = article.cover_image_url || `${siteConfig.url}/og-default.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: articleUrl,
      siteName: siteConfig.name,
      publishedTime: article.published_at || undefined,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const supabase = createPublicClient();

  // 1. Fetch current published article
  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !article) {
    notFound();
  }

  const typedArticle = article as Article & { category?: Category | null };
  const currentUrl = `${siteConfig.url}/news/${typedArticle.slug}`;

  // 2. Fetch related articles from same category or latest
  let relatedQuery = supabase
    .from('articles')
    .select('*, category:categories(*)')
    .eq('status', 'published')
    .neq('id', typedArticle.id)
    .order('published_at', { ascending: false })
    .limit(3);

  if (typedArticle.category_id) {
    relatedQuery = relatedQuery.eq('category_id', typedArticle.category_id);
  }

  const { data: relatedArticles } = await relatedQuery;

  return (
    <article className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-red-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Top Stories
        </Link>

        {typedArticle.category && (
          <Link
            href={`/category/${typedArticle.category.slug}`}
            className="hover:underline font-bold uppercase tracking-wider text-red-600"
          >
            {typedArticle.category.name}
          </Link>
        )}
      </div>

      {/* Article Header */}
      <header className="space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {typedArticle.is_breaking && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-white" /> Breaking Report
            </span>
          )}
          {typedArticle.is_featured && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> Spotlight
            </span>
          )}
          {typedArticle.category && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              {typedArticle.category.name}
            </span>
          )}
        </div>

        {/* Big Bold Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-neutral-950 dark:text-white leading-tight sm:leading-tight">
          {typedArticle.title}
        </h1>

        {/* Excerpt / Lead */}
        {typedArticle.excerpt && (
          <p className="text-lg sm:text-xl font-serif italic text-neutral-600 dark:text-neutral-300 border-l-4 border-red-600 pl-4 py-1.5 leading-relaxed">
            {typedArticle.excerpt}
          </p>
        )}

        {/* Byline & Timestamps */}
        <div className="pt-2 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-600 text-white font-serif font-bold flex items-center justify-center text-sm shadow-sm">
              PPT
            </div>
            <div>
              <p className="font-bold text-neutral-900 dark:text-white text-sm">
                Editorial Bureau
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(typedArticle.published_at || typedArticle.created_at)}
                </span>
                <span>•</span>
                <span>{formatTimeAgo(typedArticle.published_at || typedArticle.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <ShareButtons title={typedArticle.title} url={currentUrl} />
        </div>
      </header>

      {/* Hero Cover Image */}
      {typedArticle.cover_image_url && (
        <figure className="space-y-2">
          <div className="relative aspect-[16/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg bg-neutral-100 dark:bg-neutral-900">
            <Image
              src={typedArticle.cover_image_url}
              alt={typedArticle.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 900px) 100vw, 900px"
            />
          </div>
          <figcaption className="text-xs text-center text-neutral-400 italic">
            Pune Prime Times News Dispatch
          </figcaption>
        </figure>
      )}

      {/* Main Body Rich Text Content */}
      <section className="pt-4 max-w-3xl mx-auto">
        <RichTextRenderer content={typedArticle.content} />
      </section>

      {/* Bottom Share Section */}
      <div className="pt-8 pb-8 border-t border-b border-neutral-200 dark:border-neutral-800 max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
            Share this news story
          </h4>
          <p className="text-xs text-neutral-500">
            Help inform Pune residents and your community
          </p>
        </div>
        <ShareButtons title={typedArticle.title} url={currentUrl} />
      </div>

      {/* Related Stories Section */}
      {relatedArticles && relatedArticles.length > 0 && (
        <section className="pt-10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xl font-serif font-black text-neutral-900 dark:text-white">
              Related Coverage
            </h3>
            {typedArticle.category && (
              <Link
                href={`/category/${typedArticle.category.slug}`}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                More {typedArticle.category.name} &rarr;
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(relatedArticles as (Article & { category?: Category | null })[]).map(
              (art) => (
                <ArticleCard key={art.id} article={art} variant="standard" />
              )
            )}
          </div>
        </section>
      )}
    </article>
  );
}

