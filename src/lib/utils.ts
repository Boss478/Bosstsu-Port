/**
 * Shared utility functions used across the application.
 */

/**
 * Parse a comma-separated tags string into an array of trimmed, non-empty tags.
 * @param tagsStr - Comma-separated tags string (e.g., "tag1, tag2, tag3")
 * @returns Array of trimmed tag strings
 */
export function parseTags(tagsStr?: string): string[] {
  return tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
}

/**
 * Convert a text string to a URL-friendly slug.
 * - Lowercase
 * - Remove non-word characters (except spaces and hyphens)
 * - Replace spaces with hyphens
 * - Collapse multiple hyphens
 * - Trim leading/trailing hyphens
 * @param text - Text to convert
 * @returns URL-friendly slug
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
