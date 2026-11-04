'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils/slugify';
import { articleSchema, type ArticleFormValues } from '@/lib/validations/article';
import CoverImageUpload from './CoverImageUpload';
import TiptapEditor from './TiptapEditor';
import RichTextRenderer from '@/components/public/RichTextRenderer';
import { formatDate } from '@/lib/utils/format-date';
import { siteConfig } from '@/lib/site-config';
import type { Category, Article } from '@/lib/types';
import { toast } from 'sonner';
import {
  Save,
  Send,
  Eye,
  X,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface ArticleEditorProps {
  initialArticle?: Article | null;
  categories: Category[];
}

export default function ArticleEditor({
  initialArticle,
  categories,
}: ArticleEditorProps) {
  const router = useRouter();
  const [articleId, setArticleId] = useState<string | null>(
    initialArticle?.id || null
  );

  // Form State
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [slug, setSlug] = useState(initialArticle?.slug || '');
  const [isSlugTouched, setIsSlugTouched] = useState(!!initialArticle?.slug);
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || '');
  const [categoryId, setCategoryId] = useState(initialArticle?.category_id || '');
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialArticle?.cover_image_url || ''
  );
  const [content, setContent] = useState<any>(
    initialArticle?.content || { type: 'doc', content: [] }
  );
  const [isFeatured, setIsFeatured] = useState(
    initialArticle?.is_featured || false
  );
  const [isBreaking, setIsBreaking] = useState(
    initialArticle?.is_breaking || false
  );
  const [status, setStatus] = useState<'draft' | 'published'>(
    initialArticle?.status || 'draft'
  );

  // UI State
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-generate slug when title changes (unless editor manually customized the slug)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setIsDirty(true);
    if (!isSlugTouched) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugTouched(true);
    setSlug(slugify(val));
    setIsDirty(true);
  };

  // Helper to persist article to Supabase
  const persistArticle = async (
    targetStatus: 'draft' | 'published',
    isAutoSave = false
  ) => {
    if (!title.trim()) {
      if (!isAutoSave) toast.error('Please enter an article headline');
      return null;
    }

    const currentSlug = slug.trim() || slugify(title);

    const payload = {
      title: title.trim(),
      slug: currentSlug,
      excerpt: excerpt.trim() || null,
      content,
      cover_image_url: coverImageUrl || null,
      category_id: categoryId || null,
      status: targetStatus,
      is_featured: isFeatured,
      is_breaking: isBreaking,
      published_at:
        targetStatus === 'published'
          ? initialArticle?.published_at || new Date().toISOString()
          : null,
    };

    // Client-side schema validation
    const validation = articleSchema.safeParse(payload);
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Invalid input';
      if (!isAutoSave) toast.error(errorMsg);
      return null;
    }

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (articleId) {
        // Update existing article
        const { error } = await supabase
          .from('articles')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', articleId);

        if (error) throw error;
      } else {
        // Insert new article
        const { data, error } = await supabase
          .from('articles')
          .insert({
            ...payload,
            author_id: user?.id || null,
          })
          .select('id')
          .single();

        if (error) throw error;
        if (data?.id) {
          setArticleId(data.id);
          // Silently update browser URL without re-mounting
          window.history.replaceState(null, '', `/admin/${data.id}/edit`);
        }
      }

      setStatus(targetStatus);
      setIsDirty(false);
      setLastAutosaved(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      return true;
    } catch (err: any) {
      console.error('Error saving article:', err);
      if (!isAutoSave) {
        toast.error(`Save failed: ${err.message || 'Database error'}`);
      }
      return false;
    }
  };

  // Explicit Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    const success = await persistArticle('draft', false);
    setSaving(false);
    if (success) {
      toast.success('Draft saved successfully');
    }
  };

  // Explicit Publish
  const handlePublish = async () => {
    if (!categoryId) {
      toast.error('Please assign a category before publishing');
      return;
    }
    setSaving(true);
    const success = await persistArticle('published', false);
    setSaving(false);
    if (success) {
      toast.success('Article published to live site!');
      router.push('/admin');
      router.refresh();
    }
  };

  // Unpublish back to draft
  const handleUnpublish = async () => {
    setSaving(true);
    const success = await persistArticle('draft', false);
    setSaving(false);
    if (success) {
      toast.success('Article reverted to draft (hidden from public)');
    }
  };

  // Autosave Draft every 30 seconds if dirty and headline is filled
  useEffect(() => {
    if (!isDirty || !title.trim() || status === 'published') return;

    const timer = setTimeout(() => {
      persistArticle('draft', true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [isDirty, title, slug, excerpt, categoryId, coverImageUrl, content, isFeatured, isBreaking, status]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-white">
                {articleId ? 'Edit Article' : 'New Article'}
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                  status === 'published'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {status}
              </span>
            </div>
            {lastAutosaved && (
              <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Autosaved at {lastAutosaved}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>

          {status === 'published' ? (
            <button
              type="button"
              disabled={saving}
              onClick={handleUnpublish}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {status === 'published' ? 'Update & Republish' : 'Publish Story'}
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Headline */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
              Headline *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Pune Metro Expands Services to Hinjawadi IT Corridor"
              className="w-full text-lg sm:text-xl font-serif font-bold px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-neutral-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
              URL Slug
            </label>
            <div className="flex items-center rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 overflow-hidden text-xs">
              <span className="pl-3 pr-1 text-neutral-500 select-none hidden sm:inline">
                {siteConfig.url}/news/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="pune-metro-expands-services"
                className="flex-1 py-2 px-2 bg-transparent text-neutral-900 dark:text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Summary / Excerpt (Lead Paragraph)
              </label>
              <span className="text-[11px] text-neutral-400">
                {excerpt.length}/500 chars
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value);
                setIsDirty(true);
              }}
              placeholder="A concise, punchy 1-2 sentence lead for social media previews and article cards..."
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-y"
            />
          </div>

          {/* Tiptap Rich Text Editor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
              Article Body & Media
            </label>
            <TiptapEditor
              content={content}
              onChange={(json) => {
                setContent(json);
                setIsDirty(true);
              }}
            />
          </div>
        </div>

        {/* Right 1 Col: Metadata & Settings Sidebar */}
        <div className="space-y-6">
          {/* Cover Photo */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <CoverImageUpload
              value={coverImageUrl}
              onChange={(url) => {
                setCoverImageUrl(url);
                setIsDirty(true);
              }}
            />
          </div>

          {/* Category Select */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Category *
              </label>
              <Link
                href="/admin/categories"
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Manage
              </Link>
            </div>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setIsDirty(true);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Editorial Toggles */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Editorial Highlights
            </h3>

            {/* Breaking News Toggle */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => {
                  setIsBreaking(e.target.checked);
                  setIsDirty(true);
                }}
                className="mt-1 w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
              />
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 group-hover:text-red-600 transition-colors">
                  <Flame className="w-4 h-4 text-red-600" />
                  Breaking News
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Displays in the top red marquee banner across the homepage.
                </p>
              </div>
            </label>

            {/* Featured Hero Toggle */}
            <label className="flex items-start gap-3 cursor-pointer group pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => {
                  setIsFeatured(e.target.checked);
                  setIsDirty(true);
                }}
                className="mt-1 w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
              />
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 group-hover:text-red-600 transition-colors">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Featured Story (Hero)
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Spotlighted in the high-impact hero position on the front page.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md p-2 sm:p-6 md:p-10 flex justify-center animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            {/* Modal Top Bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                  Preview Mode
                </span>
                <span className="text-xs text-neutral-500 truncate max-w-[150px] sm:max-w-none">
                  {selectedCategory?.name || 'Uncategorized'}
                </span>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Article Content */}
            <div className="p-4 sm:p-8 md:p-10 max-w-3xl mx-auto space-y-4 sm:space-y-6 overflow-y-auto flex-1 w-full">
              {/* Category Pill */}
              {selectedCategory && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200/50">
                  {selectedCategory.name}
                </span>
              )}

              {/* Title */}
              <h1 className="text-xl sm:text-3xl md:text-4xl font-serif font-extrabold text-neutral-900 dark:text-white leading-tight">
                {title || 'Untitled Article Headline'}
              </h1>

              {/* Excerpt */}
              {excerpt && (
                <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 font-serif italic border-l-2 border-red-500 pl-4 py-1 leading-relaxed">
                  {excerpt}
                </p>
              )}

              {/* Metadata */}
              <div className="text-xs text-neutral-500 flex items-center gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(new Date().toISOString())}</span>
                <span>•</span>
                <span>By Editorial Staff</span>
              </div>

              {/* Cover Image */}
              {coverImageUrl && (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src={coverImageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="800px"
                  />
                </div>
              )}

              {/* Rendered Body */}
              <RichTextRenderer content={content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

