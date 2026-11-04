export type Role = 'admin' | 'editor';

export interface Profile {
  id: string;
  email: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: any; // Tiptap JSON document
  cover_image_url: string | null;
  category_id: string | null;
  category?: Category | null;
  status: ArticleStatus;
  is_featured: boolean;
  is_breaking: boolean;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
