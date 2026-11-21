import indexJson from '../../.content/index.json'
import { stripBase } from '../../src/config/site'

export interface HeadingItem {
  depth: number
  slug: string
  text: string
}

export interface ArticleMeta {
  id: number
  title: string
  description: string
  views: number
  createTime: string
  modifiedTime: string
  cover: string[]
  tags: string[]
  categories: string[]
}

export interface ArticleIndexItem {
  meta: ArticleMeta
  coverSize?: { width: number; height: number }
  wordCount: number
  readingTime: number
  headings: HeadingItem[]
}

export const articleIndex = indexJson as unknown as ArticleIndexItem[]

export const getArticleIndex = (id: number) => articleIndex.find((item) => item.meta.id === id)

const loaders = import.meta.glob<{ html: string }>('../../.content/articles/*.json', { import: 'default' })
const byId = new Map<number, () => Promise<{ html: string }>>()
for (const [path, loader] of Object.entries(loaders)) {
  const match = /(\d+)\.json$/.exec(path)
  if (match) byId.set(Number(match[1]), loader)
}

const cache = new Map<number, string>()

export async function loadArticleHtml(id: number): Promise<string> {
  const cached = cache.get(id)
  if (cached) return cached
  const loader = byId.get(id)
  if (!loader) throw new Error(`Unknown article: ${id}`)
  const module = await loader()
  const html = module.html ?? ''
  cache.set(id, html)
  return html
}

export function getCachedArticleHtml(id: number): string | undefined {
  return cache.get(id)
}

const initialPath = typeof window !== 'undefined' ? stripBase(window.location.pathname) : ''
const initialMatch = /^\/article\/(\d+)\/$/.exec(initialPath)
export const prerenderedArticle = {
  id: initialMatch ? Number(initialMatch[1]) : null,
  html:
    typeof document !== 'undefined'
      ? document.querySelector<HTMLElement>('[data-article-body]')?.innerHTML ?? ''
      : '',
}
