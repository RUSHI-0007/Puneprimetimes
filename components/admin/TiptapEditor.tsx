'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadNewsImage } from '@/lib/utils/image-compression';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Loader2,
  Undo,
  Redo,
} from 'lucide-react';

interface TiptapEditorProps {
  content: any;
  onChange: (json: any) => void;
  placeholder?: string;
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = 'Write the breaking report or article narrative here...',
}: TiptapEditorProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-6 mx-auto shadow-sm',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-red-600 underline font-medium',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'tiptap ProseMirror min-h-[350px] outline-none text-base md:text-lg leading-relaxed text-neutral-800 dark:text-neutral-200 p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[350px] flex items-center justify-center border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL (e.g. https://...):', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleInlineImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading('Compressing and inserting inline image...');

    try {
      const supabase = createClient();
      const result = await uploadNewsImage(file, supabase, 'inline');
      editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
      toast.success('Image inserted into story', { id: toastId });
    } catch (err: any) {
      toast.error(`Image upload failed: ${err.message}`, { id: toastId });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all">
      {/* Editorial Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-50/80 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg text-sm transition-colors ${
            editor.isActive('bold')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg text-sm transition-colors ${
            editor.isActive('italic')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg text-sm transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50'
          }`}
          title="Heading 2 (Section Title)"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-lg text-sm transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50'
          }`}
          title="Heading 3 (Sub-heading)"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg text-sm transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg text-sm transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg text-sm transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50'
          }`}
          title="Blockquote (Pullquote)"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50"
          title="Divider Line"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded-lg text-sm transition-colors ${
            editor.isActive('link')
              ? 'bg-neutral-200 dark:bg-neutral-700 text-red-600'
              : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50'
          }`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-2 rounded-lg text-sm text-neutral-500 hover:text-red-600"
            title="Remove Link"
          >
            <Unlink className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          disabled={uploadingImage}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50 transition-colors"
          title="Insert compressed inline photo"
        >
          {uploadingImage ? (
            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          ) : (
            <ImageIcon className="w-4 h-4 text-red-600" />
          )}
          <span>Add Image</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInlineImageSelect}
          className="hidden"
        />

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-lg text-sm text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-lg text-sm text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tiptap content canvas */}
      <div className="tiptap-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
