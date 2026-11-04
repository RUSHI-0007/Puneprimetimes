import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import type { Article, Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  // 1. Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  // 2. Fetch all articles (including drafts) with category relationship
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(*)
    `)
    .order('updated_at', { ascending: false });

  return (
    <AdminDashboardClient
      initialArticles={(articles as (Article & { category?: Category | null })[]) || []}
      categories={(categories as Category[]) || []}
    />
  );
}

