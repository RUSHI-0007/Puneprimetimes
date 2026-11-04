import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'ul',
      'ol',
      'li',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'a',
      'img',
      'figure',
      'figcaption',
      'hr',
      'br',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'target',
      'rel',
      'class',
      'width',
      'height',
      'loading',
    ],
    ADD_ATTR: ['target', 'rel'],
  });
}
