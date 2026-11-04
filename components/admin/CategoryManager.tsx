'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils/slugify';
import { categorySchema } from '@/lib/validations/article';
import DeleteConfirmModal from './DeleteConfirmModal';
import type { Category } from '@/lib/types';
import { toast } from 'sonner';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  Tag,
} from 'lucide-react';

interface CategoryManagerProps {
  initialCategories: Category[];
}

export default function CategoryManager({
  initialCategories,
}: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  // New Category State
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [adding, setAdding] = useState(false);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [updating, setUpdating] = useState(false);

  // Deleting State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!isSlugManual) {
      setNewSlug(slugify(val));
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = newSlug.trim() || slugify(newName);

    const validation = categorySchema.safeParse({
      name: newName.trim(),
      slug: cleanSlug,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Invalid category details');
      return;
    }

    setAdding(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newName.trim(),
          slug: cleanSlug,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) => [...prev, data]);
      setNewName('');
      setNewSlug('');
      setIsSlugManual(false);
      toast.success(`Category "${data.name}" created`);
      router.refresh();
    } catch (err: any) {
      toast.error(`Failed to add category: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditSlug('');
  };

  const handleUpdateCategory = async (id: string) => {
    const cleanSlug = editSlug.trim() || slugify(editName);

    const validation = categorySchema.safeParse({
      name: editName.trim(),
      slug: cleanSlug,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Invalid details');
      return;
    }

    setUpdating(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editName.trim(),
          slug: cleanSlug,
        })
        .eq('id', id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, name: editName.trim(), slug: cleanSlug } : c
        )
      );
      toast.success('Category updated successfully');
      cancelEdit();
      router.refresh();
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      toast.success(`Category "${categoryToDelete.name}" deleted`);
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      router.refresh();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white">
          News Categories
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Organize your news beats, topics, and navigational sections.
        </p>
      </div>

      {/* Add New Category Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-red-600" />
          Add New Beat / Category
        </h2>
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Pune Real Estate"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={newSlug}
                onChange={(e) => {
                  setIsSlugManual(true);
                  setNewSlug(slugify(e.target.value));
                }}
                placeholder="pune-real-estate"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-mono outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Category
            </button>
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
            Active Categories ({categories.length})
          </h3>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No categories defined yet. Add your first category above!
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;
              return (
                <li
                  key={cat.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={editSlug}
                        onChange={(e) => setEditSlug(slugify(e.target.value))}
                        className="px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-white text-base">
                        {cat.name}
                      </span>
                      <p className="text-xs font-mono text-neutral-400 mt-0.5">
                        /category/{cat.slug}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => handleUpdateCategory(cat.id)}
                          className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          title="Save"
                        >
                          {updating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:opacity-80"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Rename Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryToDelete(cat);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Delete Category Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? Any articles currently in this category will become unassigned.`}
        confirmText="Delete Category"
        isDeleting={isDeleting}
        onConfirm={confirmDeleteCategory}
        onCancel={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
      />
    </div>
  );
}
