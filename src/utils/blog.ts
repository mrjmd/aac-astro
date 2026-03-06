/**
 * Shared blog collection filter.
 * Excludes drafts and posts with a future publishDate.
 * Use this everywhere blog posts are listed (not in getStaticPaths for individual pages).
 */
export function isPublished(entry: { data: { draft: boolean; publishDate: Date } }): boolean {
  return !entry.data.draft && entry.data.publishDate.valueOf() <= Date.now();
}
