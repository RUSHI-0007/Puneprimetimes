export function slugify(text: string): string {
  const cleaned = text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize accented characters
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/[\s_-]+/g, '-') // Swap spaces and underscores for dashes
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing dashes

  if (!cleaned) {
    // Fallback for non-latin headlines (e.g. Marathi / Devanagari script)
    return `story-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  }

  return cleaned;
}

