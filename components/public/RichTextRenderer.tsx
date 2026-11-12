import { sanitizeHtml } from '@/lib/utils/sanitize';

interface RichTextRendererProps {
  content: any; // Tiptap JSON or raw HTML string
  className?: string;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function astToHtml(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;

  if (node.type === 'text') {
    let text = escapeHtml(node.text || '');
    if (node.marks && Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        if (mark.type === 'bold' || mark.type === 'strong') {
          text = `<strong>${text}</strong>`;
        } else if (mark.type === 'italic' || mark.type === 'em') {
          text = `<em>${text}</em>`;
        } else if (mark.type === 'strike') {
          text = `<s>${text}</s>`;
        } else if (mark.type === 'underline') {
          text = `<u>${text}</u>`;
        } else if (mark.type === 'code') {
          text = `<code class="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono">${text}</code>`;
        } else if (mark.type === 'link') {
          const rawHref = mark.attrs?.href || '#';
          const href = escapeHtml(rawHref);
          text = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-red-600 underline font-medium hover:text-red-700">${text}</a>`;
        }
      }
    }
    return text;
  }

  const inner =
    node.content && Array.isArray(node.content)
      ? node.content.map(astToHtml).join('')
      : '';

  switch (node.type) {
    case 'doc':
      return inner;
    case 'paragraph':
      return `<p class="leading-relaxed mb-4 text-neutral-800 dark:text-neutral-200 text-base sm:text-lg">${inner}</p>`;
    case 'heading': {
      const level = Math.min(Math.max(node.attrs?.level || 2, 1), 6);
      const headingClasses =
        level === 2
          ? 'font-serif font-black text-xl sm:text-2xl mt-8 mb-3 text-neutral-900 dark:text-white'
          : level === 3
          ? 'font-serif font-bold text-lg sm:text-xl mt-6 mb-2.5 text-neutral-900 dark:text-white'
          : 'font-serif font-bold text-base sm:text-lg mt-5 mb-2 text-neutral-900 dark:text-white';
      return `<h${level} class="${headingClasses}">${inner}</h${level}>`;
    }
    case 'bulletList':
      return `<ul class="list-disc pl-6 space-y-2 mb-4 text-neutral-800 dark:text-neutral-200">${inner}</ul>`;
    case 'orderedList':
      return `<ol class="list-decimal pl-6 space-y-2 mb-4 text-neutral-800 dark:text-neutral-200">${inner}</ol>`;
    case 'listItem':
      return `<li class="leading-relaxed">${inner}</li>`;
    case 'blockquote':
      return `<blockquote class="border-l-4 border-red-600 pl-4 italic my-5 text-neutral-700 dark:text-neutral-300">${inner}</blockquote>`;
    case 'horizontalRule':
      return '<hr class="my-8 border-neutral-200 dark:border-neutral-800" />';
    case 'hardBreak':
      return '<br />';
    case 'image': {
      const src = node.attrs?.src;
      const alt = node.attrs?.alt || '';
      return src
        ? `<img src="${escapeHtml(
            src
          )}" alt="${escapeHtml(
            alt
          )}" class="rounded-xl max-w-full my-6 mx-auto shadow-sm" loading="lazy" />`
        : '';
    }
    default:
      return inner;
  }
}

export default function RichTextRenderer({
  content,
  className = '',
}: RichTextRendererProps) {
  if (!content) return null;

  let renderedHtml = '';
  try {
    if (typeof content === 'string') {
      renderedHtml = sanitizeHtml(content);
    } else if (typeof content === 'object') {
      renderedHtml = sanitizeHtml(astToHtml(content));
    }
  } catch {
    renderedHtml = '';
  }

  if (!renderedHtml) return null;

  return (
    <div
      className={`tiptap-content max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
