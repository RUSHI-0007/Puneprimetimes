import { createClient } from '@/lib/supabase/server';
import ArticleEditor from '@/components/admin/ArticleEditor';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function NewArticlePage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return (
    <ArticleEditor
      categories={(categories as Category[]) || []}
    />
  );
}

