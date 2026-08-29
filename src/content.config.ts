import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().default(''),
    views: z.number().default(0),
    createTime: z.string(),
    modifiedTime: z.string(),
    cover: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
