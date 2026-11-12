import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/server';
import { siteConfig } from '@/lib/site-config';
import ArticleDetailView from '@/components/public/ArticleDetailView';
import type { Article, Category } from '@/lib/types';

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
  try {
    const supabase = createPublicClient();
    const rawSlug = params.slug;
    const slug = decodeURIComponent(rawSlug);

    const { data: article } = await supabase
      .from('articles')
      .select('title, excerpt, cover_image_url, slug, published_at')
      .or(`slug.eq.${slug},slug.eq.${rawSlug}`)
      .eq('status', 'published')
      .maybeSingle();

    if (!article) {
      return {
        title: `Article Not Found | ${siteConfig.name}`,
      };
    }

    const title = article.title;
    const description =
      article.excerpt || `${article.title} - Read full report on ${siteConfig.name}`;
    const baseUrl = siteConfig.url.replace(/\/$/, '');
    const articleUrl = `${baseUrl}/news/${article.slug}`;
    const rawImage = article.cover_image_url || siteConfig.ogImage;
    const ogImage = rawImage.startsWith('http')
      ? rawImage
      : `${baseUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;

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
        locale: 'mr_IN',
        publishedTime: article.published_at || undefined,
        images: [
          {
            url: ogImage,
            secureUrl: ogImage,
            width: 1200,
            height: 630,
            alt: title,
            type: ogImage.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
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
  } catch {
    return {
      title: siteConfig.name,
    };
  }
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const supabase = createPublicClient();
  const rawSlug = params.slug;
  const slug = decodeURIComponent(rawSlug);

  // 1. Fetch current published article
  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*)
    `)
    .or(`slug.eq.${slug},slug.eq.${rawSlug}`)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !article) {
    notFound();
  }

  const typedArticle = article as Article & { category?: Category | null };
  const currentUrl = `${siteConfig.url.replace(/\/$/, '')}/news/${typedArticle.slug}`;

  // 2. Fetch related published articles from same category
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
  const typedRelated = (relatedArticles || []) as (Article & { category?: Category | null })[];

  return (
    <ArticleDetailView
      article={typedArticle}
      currentUrl={currentUrl}
      relatedArticles={typedRelated}
    />
  );
}
