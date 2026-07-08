import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';

// Blog posts are committed ahead of time with future pubDates and must leave no
// trace until published — routes/hub are gated via src/lib/posts.ts; this file
// gates the two things that live at config level (sitemap priority + in-body
// links). Slugs are derived from frontmatter so adding a post needs no edits here.
const BLOG_DIR = new URL('./src/content/blog/', import.meta.url);
const blogPosts = fs
  .readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const src = fs.readFileSync(new URL(f, BLOG_DIR), 'utf8');
    const pubDate = src.match(/^pubDate:\s*["']?([0-9-]+)/m)?.[1];
    const draft = /^draft:\s*true/m.test(src);
    return {
      slug: f.replace(/\.md$/, ''),
      live: !draft && Boolean(pubDate) && new Date(pubDate) <= new Date(),
    };
  });
const blogSlugs = new Set(blogPosts.map((p) => p.slug));
const unpublishedSlugs = new Set(blogPosts.filter((p) => !p.live).map((p) => p.slug));

// Markdown bodies may cross-link a post that publishes later in the calendar.
// Unwrap those <a> tags to plain text so no internal link 404s; the daily
// scheduled rebuild restores each link automatically once its target goes live.
function rehypeGateUnpublishedLinks() {
  const strip = (node) => {
    if (!node.children) return;
    node.children = node.children.flatMap((child) => {
      if (child.type === 'element' && child.tagName === 'a') {
        const slug = String(child.properties?.href ?? '')
          .replace(/^\//, '')
          .split(/[?#]/)[0];
        if (unpublishedSlugs.has(slug)) return child.children ?? [];
      }
      strip(child);
      return [child];
    });
  };
  return strip;
}

// SEO-critical: canonical host is www + https, NO trailing slash (mirrors production).
// `site` is the PRODUCTION domain so canonicals and sitemap match the live site exactly,
// even though this build deploys to a *.pages.dev preview. The preview is kept out of the
// index via X-Robots-Tag (see public/_headers) — remove that header at production cutover.
export default defineConfig({
  site: 'https://www.plylerstreeservice.com',
  trailingSlash: 'never',
  build: {
    // emit /about -> about.html (clean, slash-less URLs on Cloudflare Pages)
    format: 'file',
    // inline all CSS into the HTML to remove render-blocking stylesheet requests (faster LCP)
    inlineStylesheets: 'always',
  },
  markdown: {
    rehypePlugins: [rehypeGateUnpublishedLinks],
  },
  integrations: [
    sitemap({
      changefreq: 'monthly',
      priority: 0.8,
      // Blog posts get priority 0.8; everything else 1.0 (matches the live sitemap).
      // Unpublished posts never reach here — they aren't routed, so they aren't built.
      serialize(item) {
        const slug = new URL(item.url).pathname.replace(/^\//, '');
        item.priority = blogSlugs.has(slug) ? 0.8 : 1.0;
        item.changefreq = 'monthly';
        return item;
      },
    }),
  ],
});
