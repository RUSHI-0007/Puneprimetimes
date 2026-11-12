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
export type Language = 'mr' | 'en';
export type AIConfidence = 'high' | 'medium' | 'low';

export interface SourceLink {
  outlet: string;
  url: string;
  title?: string;
}

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
  language?: Language;
  is_featured: boolean;
  is_breaking: boolean;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // AI Draft & Verification Fields
  ai_generated?: boolean;
  confidence?: AIConfidence | null;
  verification_notes?: string | null;
  image_suggestion?: string | null;
  source_urls?: SourceLink[] | string[] | null;
  flags?: {
    needs_careful_review?: boolean;
    cluster_size?: number;
    outlets_count?: number;
    keywords?: string[];
    [key: string]: any;
  } | null;
}

export interface AIRunLog {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'failed' | 'partial';
  stories_found: number;
  clusters_formed: number;
  drafts_created: number;
  skipped_count: number;
  api_calls_used: number;
  errors?: any;
  notes?: string | null;
}

export interface AIProcessedItem {
  id: string;
  url: string;
  title: string | null;
  outlet: string | null;
  story_hash: string | null;
  cluster_id: string | null;
  created_at: string;
}

