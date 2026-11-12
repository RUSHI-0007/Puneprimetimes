export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  return dirtyHtml
    // Strip <script>...</script>
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip <style>...</style>
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Strip dangerous event handlers (onerror, onload, onclick, etc)
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^>\s]+/gi, '')
    // Strip javascript: URLs
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*?\1/gi, 'href="#"')
    // Strip iframe, embed, object
    .replace(/<(iframe|object|embed)[^>]*>.*?<\/\1>/gi, '');
}
