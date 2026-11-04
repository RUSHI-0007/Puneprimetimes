import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ArticleEditor from '@/components/admin/ArticleEditor';
import type { Article, Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface EditArticlePageProps {
  params: {
    id: string;
  };
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const supabase = createClient();

  const [{ data: article, error: articleError }, { data: categories }] =
    await Promise.all([
      supabase.from('articles').select('*').eq('id', params.id).single(),
      supabase.from('categories').select('*').order('name'),
    ]);

  if (articleError || !article) {
    notFound();
  }

  return (
    <ArticleEditor
      initialArticle={article as Article}
      categories={(categories as Category[]) || []}
    />
  );
}
