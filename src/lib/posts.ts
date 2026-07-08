import { getCollection, type CollectionEntry } from 'astro:content';

// Single source of truth for VISIBLE blog posts. Posts with a future pubDate are
// committed ahead of time and must have no live URL until their date, so use this
// everywhere posts are listed OR routed: [post].astro getStaticPaths, the /blog hub,
// any recent-posts widget, RSS if added. (The sitemap follows automatically because
// unrouted pages are never built; in-body markdown links to unpublished posts are
// unwrapped by the rehype gate in astro.config.mjs.)
// Visibility flips at the daily rebuild (Cron, 11:00 UTC) after each pubDate passes.
export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  const now = new Date();
  return (await getCollection('blog'))
    .filter((p) => !p.data.draft && p.data.pubDate <= now)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// For .astro pages that cross-link a post which may not be published yet:
// render the link only when this returns true, so no internal link 404s.
export async function isPostPublished(id: string): Promise<boolean> {
  return (await getPublishedPosts()).some((p) => p.id === id);
}
