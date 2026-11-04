import { createClient } from '@/lib/supabase/server';
import CategoryManager from '@/components/admin/CategoryManager';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return <CategoryManager initialCategories={(categories as Category[]) || []} />;
}
