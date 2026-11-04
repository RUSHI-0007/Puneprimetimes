import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600; // 1 hour revalidation

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // 1. Fetch categories
      const { data: categories } = await supabase
        .from('categories')
        .select('slug, created_at');

      if (categories) {
        categories.forEach((cat) => {
          routes.push({
            url: `${baseUrl}/category/${cat.slug}`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.8,
          });
        });
      }

      // 2. Fetch published articles
      const { data: articles } = await supabase
        .from('articles')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(500);

      if (articles) {
        articles.forEach((art) => {
          routes.push({
            url: `${baseUrl}/news/${art.slug}`,
            lastModified: new Date(art.updated_at),
            changeFrequency: 'daily',
            priority: 0.7,
          });
        });
      }
    } catch (error) {
      console.warn('Could not connect to Supabase for sitemap generation, returning base routes:', error);
    }
  }

  return routes;
}
