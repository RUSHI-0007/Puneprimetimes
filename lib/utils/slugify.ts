export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize accented characters
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/[\s_-]+/g, '-') // Swap spaces and underscores for dashes
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing dashes
}
