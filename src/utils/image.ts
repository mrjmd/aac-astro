/**
 * Image utilities for serving optimized WebP with responsive srcset.
 *
 * All frontmatter paths stay as .jpg — these helpers convert at render time.
 */

const HAS_WEBP = (s: string) => s.startsWith('/images/projects/') && s.endsWith('.jpg');

/** Convert a project .jpg path to its optimized .webp equivalent (1400w max). */
export function webpSrc(src: string): string {
  if (!HAS_WEBP(src)) return src;
  return src.replace(/\.jpg$/, '.webp');
}

/**
 * Generate srcset for responsive project images.
 * Returns "foo-400w.webp 400w, foo-800w.webp 800w, foo.webp 1400w"
 */
export function projectSrcset(src: string): string {
  if (!HAS_WEBP(src)) return '';
  const base = src.replace(/\.jpg$/, '');
  return `${base}-400w.webp 400w, ${base}-800w.webp 800w, ${base}.webp 1400w`;
}
