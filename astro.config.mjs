import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
  integrations: [
    sitemap({
      changefreq: 'monthly',
      priority: 0.8,
      // Blog posts had priority 0.8; everything else 1.0 on the live sitemap.
      serialize(item) {
        if (/\/(signs-tree-is-dying|tree-trimming-vs-removal|stump-grinding-vs-removal|when-to-remove-a-tree-arkadelphia|questions-to-ask-before-hiring-tree-service-arkansas|what-to-do-after-storm-tree-down-arkansas|is-my-tree-too-close-to-my-house-arkansas)/.test(item.url)) {
          item.priority = 0.8;
        } else {
          item.priority = 1.0;
        }
        item.changefreq = 'monthly';
        return item;
      },
    }),
  ],
});
