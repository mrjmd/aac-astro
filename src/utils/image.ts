/**
 * Image utilities for serving optimized WebP with responsive srcset.
 *
 * All frontmatter paths stay as .jpg — these helpers convert at render time.
 */

const HAS_WEBP = (s: string) => s.startsWith('/images/') && s.endsWith('.jpg');
const HAS_SRCSET = (s: string) => (s.startsWith('/images/projects/') || s.startsWith('/images/blog/')) && s.endsWith('.jpg');

/** Convert a .jpg path to its optimized .webp equivalent. */
export function webpSrc(src: string): string {
  if (!HAS_WEBP(src)) return src;
  return src.replace(/\.jpg$/, '.webp');
}

/**
 * Generate srcset for responsive project/blog images.
 * Returns "foo-400w.webp 400w, foo-800w.webp 800w, foo.webp 1400w"
 */
export function projectSrcset(src: string): string {
  if (!HAS_SRCSET(src)) return '';
  const base = src.replace(/\.jpg$/, '');
  return `${base}-400w.webp 400w, ${base}-800w.webp 800w, ${base}.webp 1400w`;
}
