/**
 * Static JSON feed of ALL blog posts (drafts + published).
 *
 * Pre-rendered at build time (Astro static output) — refreshes on every deploy.
 * Consumed by the marketing app's calendar to surface blog cadence alongside
 * social and GBP scheduled posts.
 *
 * Includes drafts because future-scheduled posts live as drafts until a cron
 * flips `draft: false` on their publishDate. The marketing calendar wants to
 * see those upcoming posts so the user can plan around them.
 *
 * The `draft` flag is included in each entry so consumers can distinguish
 * "scheduled to publish" from "already live".
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog');

  const out = posts.map((post) => {
    const slug = post.id.replace(/\.md$/, '');
    return {
      slug,
      title: post.data.title,
      excerpt: post.data.excerpt,
      publishDate: post.data.publishDate.toISOString(),
      heroImage: post.data.heroImage ?? null,
      category: post.data.category,
      draft: post.data.draft,
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
