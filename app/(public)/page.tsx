import { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/server';
import { siteConfig } from '@/lib/site-config';
import HomePageClient from '@/components/public/HomePageClient';
import type { Article, Category } from '@/lib/types';

export const revalidate = 60; // 60s ISR

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `${siteConfig.name} | पुणे आणि महाराष्ट्राच्या ताज्या घडामोडी`,
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
      .limit(40),
    supabase.from('categories').select('*').order('name'),
  ]);

  const allArticles = (articles as (Article & { category?: Category | null })[]) || [];
  const allCategories = (categories as Category[]) || [];

  return <HomePageClient articles={allArticles} categories={allCategories} />;
}
