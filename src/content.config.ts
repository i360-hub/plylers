import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts. NOTE: posts render at ROOT-level slugs (e.g. /signs-tree-is-dying),
// NOT under /blog/. See src/pages/[post].astro for the renderer. The /blog page
// (src/pages/blog.astro) is only the index.
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string(),
    heroAlt: z.string(),
    author: z.string().default("Robbie Plyler"),
  }),
});

export const collections = { blog };
