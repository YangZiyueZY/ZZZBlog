import { z } from 'zod'

/**
 * YAML 在无引号时会把 `2025-01-01 10:00:00` 解析成 JS Date；
 * Pages CMS 保存的日期就是这种未加引号的形式。
 * 这里统一转回项目约定的字符串格式，避免 CI 构建因类型不匹配失败。
 */
const dateString = z.preprocess((value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ` +
      `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
  }
  return value
}, z.string())

/**
 * Vue 构建脚本侧的 frontmatter schema（zod 4）。
 * 迁移期与 Astro 的 src/content.config.ts 双写；P5 删除 Astro 后合并为一份。
 */
export const articleSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().default(''),
  views: z.number().default(0),
  createTime: dateString,
  modifiedTime: dateString,
  cover: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
})

export type ArticleFrontmatter = z.infer<typeof articleSchema>
