import { createClient } from '@/lib/supabase/server';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import BreakingBanner from '@/components/public/BreakingBanner';
import type { Category, Article } from '@/lib/types';

// Revalidate public layouts periodically or via ISR
export const revalidate = 60; // 60 seconds ISR

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Fetch categories and any breaking news in parallel
  const [{ data: categories }, { data: breakingArticles }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .eq('is_breaking', true)
      .order('published_at', { ascending: false })
      .limit(1),
  ]);

  const activeBreaking = breakingArticles?.[0] as Article | undefined;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <BreakingBanner breakingArticle={activeBreaking} />
      <Header categories={(categories as Category[]) || []} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {children}
      </main>
      <Footer categories={(categories as Category[]) || []} />
    </div>
  );
}

