'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatTimeAgo } from '@/lib/utils/format-date';
import DeleteConfirmModal from './DeleteConfirmModal';
import type { Article, Category } from '@/lib/types';
import { toast } from 'sonner';
import {
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  ExternalLink,
  Flame,
  Sparkles,
  CheckCircle2,
  Clock,
  EyeOff,
  Send,
  FileText,
} from 'lucide-react';

interface AdminDashboardClientProps {
  initialArticles: (Article & { category?: Category | null })[];
  categories: Category[];
}

export default function AdminDashboardClient({
  initialArticles,
  categories,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle publish state
  const handleToggleStatus = async (article: Article) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('articles')
        .update({
          status: nextStatus,
          published_at:
            nextStatus === 'published'
              ? article.published_at || new Date().toISOString()
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);

      if (error) throw error;

      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id
            ? {
                ...a,
                status: nextStatus,
                published_at:
                  nextStatus === 'published'
                    ? a.published_at || new Date().toISOString()
                    : null,
              }
            : a
        )
      );

      toast.success(
        nextStatus === 'published'
          ? 'Article published to live website'
          : 'Article returned to draft'
      );
      router.refresh();
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  // Delete article
  const confirmDelete = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleToDelete.id);

      if (error) throw error;

      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      toast.success('Article deleted successfully');
      setDeleteModalOpen(false);
      setArticleToDelete(null);
      router.refresh();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered articles list
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesSearch =
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ? true : art.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'all' ? true : art.category_id === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [articles, searchQuery, statusFilter, categoryFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter((a) => a.status === 'published').length;
    const drafts = articles.filter((a) => a.status === 'draft').length;
    const breaking = articles.filter((a) => a.is_breaking).length;
    return { total, published, drafts, breaking };
  }, [articles]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white">
            Editorial Articles
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your newsroom coverage, drafts, breaking dispatches, and publications.
          </p>
        </div>
        <Link
          href="/admin/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-md shadow-red-600/20 active:scale-95 transition-all self-stretch sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Write Article
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Stories
          </span>
          <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0.5 sm:mt-1">
            {stats.total}
          </p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Published
          </span>
          <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0.5 sm:mt-1">
            {stats.published}
          </p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Drafts
          </span>
          <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0.5 sm:mt-1">
            {stats.drafts}
          </p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <span className="text-[11px] sm:text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            Breaking
          </span>
          <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0.5 sm:mt-1">
            {stats.breaking}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories by headline or slug..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 text-xs font-medium flex-1 sm:flex-none justify-between sm:justify-start">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex-1 sm:flex-none text-center ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex-1 sm:flex-none text-center ${
                statusFilter === 'published'
                  ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex-1 sm:flex-none text-center ${
                statusFilter === 'draft'
                  ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Drafts
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 outline-none w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Content: Mobile Cards vs Desktop Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
              No articles found
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try clearing your filters or search keywords.'
                : 'Get started by creating your very first article.'}
            </p>
            {articles.length === 0 && (
              <Link
                href="/admin/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-red-600 text-white text-xs font-semibold"
              >
                <PlusCircle className="w-4 h-4" />
                Write First Story
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE VIEW (< 640px): Touch-friendly cards */}
            <div className="sm:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredArticles.map((art) => (
                <div key={art.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {art.cover_image_url ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 border border-neutral-200 dark:border-neutral-800">
                        <Image
                          src={art.cover_image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0 text-neutral-400">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            art.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${
                              art.status === 'published'
                                ? 'bg-emerald-600'
                                : 'bg-amber-600'
                            }`}
                          />
                          {art.status}
                        </span>
                        {art.category && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {art.category.name}
                          </span>
                        )}
                        {art.is_breaking && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">
                            <Flame className="w-2.5 h-2.5" /> Breaking
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/admin/${art.id}/edit`}
                        className="font-medium text-sm text-neutral-900 dark:text-white line-clamp-2 leading-snug"
                      >
                        {art.title}
                      </Link>
                      <span className="text-[11px] text-neutral-400 mt-1 block">
                        {formatTimeAgo(art.published_at || art.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions Bar */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(art)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        art.status === 'published'
                          ? 'border-neutral-200 dark:border-neutral-700 text-neutral-600'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {art.status === 'published' ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Unpublish
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Publish
                        </>
                      )}
                    </button>

                    {art.status === 'published' && (
                      <Link
                        href={`/news/${art.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
                        title="View live story"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}

                    <Link
                      href={`/admin/${art.id}/edit`}
                      className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setArticleToDelete(art);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-800/40 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                    <th className="py-3.5 px-4 sm:px-6">Article</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                  {filteredArticles.map((art) => (
                    <tr
                      key={art.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors group"
                    >
                      {/* Article Title & Cover */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {art.cover_image_url ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 border border-neutral-200 dark:border-neutral-800">
                              <Image
                                src={art.cover_image_url}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0 text-neutral-400">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-md">
                            <Link
                              href={`/admin/${art.id}/edit`}
                              className="font-medium text-neutral-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-1"
                            >
                              {art.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                              <span className="font-mono truncate max-w-[200px]">
                                /news/{art.slug}
                              </span>
                              {art.is_breaking && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                  <Flame className="w-3 h-3" /> Breaking
                                </span>
                              )}
                              {art.is_featured && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                  <Sparkles className="w-3 h-3" /> Hero
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {art.category ? (
                          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {art.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            art.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              art.status === 'published'
                                ? 'bg-emerald-600'
                                : 'bg-amber-600'
                            }`}
                          />
                          {art.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-neutral-500">
                        <div>
                          {art.status === 'published' && art.published_at
                            ? formatDate(art.published_at)
                            : formatDate(art.updated_at)}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {formatTimeAgo(art.updated_at)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick toggle publish */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(art)}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              art.status === 'published'
                                ? 'text-neutral-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                            title={
                              art.status === 'published'
                                ? 'Unpublish (Switch to draft)'
                                : 'Quick Publish'
                            }
                          >
                            {art.status === 'published' ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>

                          {/* View Live */}
                          {art.status === 'published' && (
                            <Link
                              href={`/news/${art.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="View published article"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Edit */}
                          <Link
                            href={`/admin/${art.id}/edit`}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800 transition-colors"
                            title="Edit article"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setArticleToDelete(art);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800 transition-colors"
                            title="Delete article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Article"
        message={`Are you sure you want to permanently delete "${articleToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Article"
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setArticleToDelete(null);
        }}
      />
    </div>
  );
}
