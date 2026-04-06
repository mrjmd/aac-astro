/**
 * Static JSON feed of all non-draft blog posts.
 *
 * Pre-rendered at build time (Astro static output) — refreshes on every deploy.
 * Consumed by the marketing app's calendar to surface blog cadence alongside
 * social and GBP scheduled posts.
 *
 * Includes future-dated posts (we filter only by `draft`, not by date) so the
 * marketing calendar can show upcoming blog publications.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  const out = posts.map((post) => {
    const slug = post.id.replace(/\.md$/, '');
    return {
      slug,
      title: post.data.title,
      excerpt: post.data.excerpt,
      publishDate: post.data.publishDate.toISOString(),
      heroImage: post.data.heroImage ?? null,
      category: post.data.category,
      url: `https://www.attackacrack.com/blog/${slug}/`,
    };
  });

  // Sort newest first for predictable consumption
  out.sort((a, b) => b.publishDate.localeCompare(a.publishDate));

  return new Response(JSON.stringify(out), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600',
    },
  });
};
