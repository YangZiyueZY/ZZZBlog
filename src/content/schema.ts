import { z } from 'zod'

/**
 * Vue 构建脚本侧的 frontmatter schema（zod 4）。
 * 迁移期与 Astro 的 src/content.config.ts 双写；P5 删除 Astro 后合并为一份。
 */
export const articleSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().default(''),
  views: z.number().default(0),
  createTime: z.string(),
  modifiedTime: z.string(),
  cover: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
})

export type ArticleFrontmatter = z.infer<typeof articleSchema>
