import { useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import { sanitizeHtml } from '@/lib/utils/sanitize';

interface RichTextRendererProps {
  content: any; // Tiptap JSON or string
  className?: string;
}

export default function RichTextRenderer({
  content,
  className = '',
}: RichTextRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    try {
      // If content is already a string (raw HTML fallback)
      if (typeof content === 'string') {
        return sanitizeHtml(content);
      }

      // If content is Tiptap JSON
      const rawHtml = generateHTML(content, [
        StarterKit,
        ImageExtension.configure({
          HTMLAttributes: {
            class: 'rounded-xl max-w-full my-6 mx-auto shadow-sm',
            loading: 'lazy',
          },
        }),
        LinkExtension.configure({
          HTMLAttributes: {
            class: 'text-red-600 underline font-medium hover:text-red-700',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        }),
      ]);

      return sanitizeHtml(rawHtml);
    } catch (err) {
      console.error('Error rendering rich text:', err);
      return '';
    }
  }, [content]);

  if (!renderedHtml) {
    return null;
  }

  return (
    <div
      className={`tiptap-content max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

