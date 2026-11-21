import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import matter from 'gray-matter'
import { imageSize } from 'image-size'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkSmartypants from 'remark-smartypants'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeShiki from '@shikijs/rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { toString } from 'hast-util-to-string'
import type { Element, Root } from 'hast'
import { articleSchema } from '../src/content/schema'
import { articleStats } from '../src/lib/articles'
import { siteConfig } from '../src/config/site'
import rehypeImageAttrs from '../src/lib/rehype-image-attrs.mjs'

const root = process.cwd()
const articlesDir = resolve(root, 'src/content/articles')
const outDir = resolve(root, '.content')
const publicDir = resolve(root, 'public')
const base = siteConfig.base.replace(/\/+$/, '')

interface HeadingItem {
  depth: number
  slug: string
  text: string
}

function collectHeadings(headings: HeadingItem[]) {
  return (tree: Root) => {
    headings.length = 0
    visit(tree, 'element', (node: Element) => {
      const match = /^h([1-6])$/.exec(node.tagName)
      if (!match) return
      const id = typeof node.properties?.id === 'string' ? node.properties.id : ''
      headings.push({ depth: Number(match[1]), slug: id, text: toString(node) })
    })
  }
}

function rehypeDataLanguage() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return
      const code = node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'code',
      )
      const cls = code?.properties?.className
      const lang = Array.isArray(cls) ? cls.find((c) => typeof c === 'string' && c.startsWith('language-'))?.slice(9) : undefined
      if (lang) node.properties = { ...node.properties, 'data-language': lang }
    })
  }
}

function coverSize(cover?: string) {
  if (!cover) return undefined
  try {
    const file = resolve(publicDir, decodeURIComponent(cover).replace(/^\//, ''))
    const size = imageSize(readFileSync(file))
    return size.width && size.height ? { width: size.width, height: size.height } : undefined
  } catch {
    return undefined
  }
}

async function render(markdown: string) {
  const headings: HeadingItem[] = []
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkSmartypants)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(collectHeadings, headings)
    .use(rehypeShiki, { theme: 'github-dark', addLanguageClass: true })
    .use(rehypeDataLanguage)
    .use(rehypeKatex)
    .use(rehypeImageAttrs, { base })
    .use(rehypeStringify, { allowDangerousHtml: true })

  const file = await processor.process(markdown)
  const html = String(file).replace(
    /<pre([^>]*)><code class="language-([^"]+)"/g,
    '<pre$1 data-language="$2"><code class="language-$2"',
  )
  return { html, headings }
}

function searchText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`|~\-_]|^\s*[-+]\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1500)
}

const PROFILE_IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i

function scanProfileImages(subdir: 'badges' | 'cg'): string[] {
  const dir = resolve(publicDir, 'img/profile', subdir)
  if (!existsSync(dir)) return []
  const files = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && PROFILE_IMAGE_EXT.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
  if (files.length > 6) {
    console.warn('[content] public/img/profile/' + subdir + ' 有 ' + files.length + ' 张图片，按文件名升序只取前 6 张')
  }
  return files.slice(0, 6).map((name) => encodeURI('/img/profile/' + subdir + '/' + name))
}

async function main() {
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(resolve(outDir, 'articles'), { recursive: true })

  const files = readdirSync(articlesDir).filter((file) => file.endsWith('.md'))
  const articles: any[] = []
  let failed = false

  for (const file of files) {
    const raw = readFileSync(resolve(articlesDir, file), 'utf8')
    const { data, content } = matter(raw)
    const parsed = articleSchema.safeParse(data)
    if (!parsed.success) {
      failed = true
      console.error(`[content] 校验失败：src/content/articles/${file}`)
      for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      }
      continue
    }

    const frontmatter = parsed.data
    const { html, headings } = await render(content)
    const stats = articleStats(content)

    articles.push({
      meta: frontmatter,
      coverSize: coverSize(frontmatter.cover[0]),
      wordCount: stats.wordCount,
      readingTime: stats.readingTime,
      headings,
      html,
      searchText: searchText(content),
    })
  }

  if (failed) process.exit(1)

  articles.sort((a, b) => a.meta.id - b.meta.id)
  const ids = new Set<number>()
  for (const article of articles) {
    if (ids.has(article.meta.id)) {
      console.error(`[content] 重复的 id: ${article.meta.id}`)
      process.exit(1)
    }
    ids.add(article.meta.id)
  }

  const index = articles.map(({ html, searchText, ...rest }) => rest)
  const searchIndex = articles.map((article) => ({
    id: article.meta.id,
    title: article.meta.title,
    url: `/article/${article.meta.id}/`,
    desc: article.meta.description,
    text: article.searchText,
  }))
  const routes = ['/', '/article/', '/about/', '/profile/', '/404/', ...articles.map((article) => `/article/${article.meta.id}/`)]

  writeFileSync(resolve(outDir, 'index.json'), JSON.stringify(index))
  writeFileSync(resolve(outDir, 'search-index.json'), JSON.stringify(searchIndex))
  writeFileSync(resolve(outDir, 'routes.json'), JSON.stringify(routes))
  writeFileSync(
    resolve(outDir, 'profile-images.json'),
    JSON.stringify({ badges: scanProfileImages('badges'), cg: scanProfileImages('cg') }),
  )
  for (const article of articles) {
    writeFileSync(resolve(outDir, 'articles', `${article.meta.id}.json`), JSON.stringify({ html: article.html }))
  }

  console.log(`[content] ${articles.length} 篇文章 → .content（index / articles / search-index / routes / profile-images）`)
  if (!existsSync(resolve(outDir, 'index.json'))) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})