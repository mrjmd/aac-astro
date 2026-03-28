/**
 * Rehype plugin that adds srcset and sizes to inline blog/project images.
 *
 * Transforms <img src="/images/blog/foo.jpg"> into responsive images with
 * srcset="foo-400w.webp 400w, foo-800w.webp 800w, foo.webp 1400w"
 * and converts the src to .webp.
 *
 * Also handles .webp source images that have no responsive variants by
 * leaving them untouched.
 */
import { visit } from 'unist-util-visit';
import { existsSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR = new URL('../../public', import.meta.url).pathname;

/** Image directories that have responsive variants. */
const RESPONSIVE_DIRS = ['/images/blog/', '/images/projects/'];

export default function rehypeResponsiveImages() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;

      const src = node.properties?.src;
      if (!src || typeof src !== 'string') return;
      if (node.properties.srcset) return; // already has srcset

      // Only process images in our responsive directories
      const inDir = RESPONSIVE_DIRS.some((d) => src.startsWith(d));
      if (!inDir) return;

      // Determine the base name (without extension)
      let base;
      let ext;
      if (src.endsWith('.jpg')) {
        base = src.slice(0, -4);
        ext = 'jpg';
      } else if (src.endsWith('.webp')) {
        base = src.slice(0, -5);
        ext = 'webp';
      } else {
        return;
      }

      // Check if responsive variants exist
      const has400 = existsSync(join(PUBLIC_DIR, `${base}-400w.webp`));
      const has800 = existsSync(join(PUBLIC_DIR, `${base}-800w.webp`));
      const hasFull = existsSync(join(PUBLIC_DIR, `${base}.webp`));

      if (!has400 || !has800 || !hasFull) return;

      // Convert src to .webp
      node.properties.src = `${base}.webp`;

      // Add srcset
      node.properties.srcset = `${base}-400w.webp 400w, ${base}-800w.webp 800w, ${base}.webp 1400w`;

      // Add sizes — inline content images render within the blog prose column
      // which is max-w-3xl (768px) with padding, so ~720px on desktop
      if (!node.properties.sizes) {
        node.properties.sizes =
          '(max-width: 768px) calc(100vw - 48px), 720px';
      }
    });
  };
}
