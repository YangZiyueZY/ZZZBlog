import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Feed } from 'feed'
import { siteConfig, authorInfo, withBase } from '../src/config/site'

const root = process.cwd()
const dist = resolve(root, 'dist')
const contentDir = resolve(root, '.content')

interface ArticleMeta {
  id: number
  title: string
  description: string
  createTime: string
  modifiedTime: string
  tags: string[]
}

const articles = JSON.parse(readFileSync(resolve(contentDir, 'index.json'), 'utf8')) as Array<{ meta: ArticleMeta }>
const routes = JSON.parse(readFileSync(resolve(contentDir, 'routes.json'), 'utf8')) as string[]

const siteUrl = `${siteConfig.site}${withBase('/')}`
const feed = new Feed({
  title: siteConfig.blogName,
  description: siteConfig.description,
  id: siteUrl,
  link: siteUrl,
  language: siteConfig.lang,
  copyright: `Copyright © ${siteConfig.copyrightYear} ${authorInfo.name}. All Rights Reserved.`,
  updated: new Date(),
  feedLinks: { rss2: `${siteConfig.site}${withBase('/rss.xml')}` },
  author: {
    name: authorInfo.name,
    email: authorInfo.email,
    link: `${siteConfig.site}${withBase('/profile/')}`,
  },
})

for (const article of articles.sort((a, b) => a.meta.id - b.meta.id)) {
  feed.addItem({
    title: article.meta.title,
    id: `${siteConfig.site}${withBase(`/article/${article.meta.id}/`)}`,
    link: `${siteConfig.site}${withBase(`/article/${article.meta.id}/`)}`,
    description: article.meta.description,
    date: new Date(article.meta.createTime),
    category: article.meta.tags.map((name) => ({ name })),
  })
}

writeFileSync(resolve(dist, 'rss.xml'), feed.rss2(), 'utf8')

const sitemapUrls = routes
  .filter((route) => route !== '/' && route !== '/404/')
  .map((route) => `<url><loc>${siteConfig.site}${withBase(route)}</loc></url>`)
  .join('')

const urlset = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls}</urlset>`
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${siteConfig.site}${withBase('/sitemap-0.xml')}</loc></sitemap></sitemapindex>`

writeFileSync(resolve(dist, 'sitemap-0.xml'), urlset, 'utf8')
writeFileSync(resolve(dist, 'sitemap-index.xml'), sitemapIndex, 'utf8')
writeFileSync(
  resolve(dist, 'robots.txt'),
  ['User-Agent: *', 'Disallow:', '', `Sitemap: ${siteConfig.site}${withBase('/sitemap-index.xml')}`, ''].join('\n'),
  'utf8',
)
writeFileSync(resolve(dist, '.nojekyll'), '', 'utf8')

// 404 静态化：PWA 插件会在 SSG 之后注入 registerSW，这里统一去掉所有脚本
const notFoundPath = resolve(dist, '404.html')
const notFound = readFileSync(notFoundPath, 'utf8')
const staticNotFound = notFound
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
  .replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')
if (/<script\b/.test(staticNotFound)) {
  throw new Error('404.html 仍包含 script，静态 404 处理失效')
}
writeFileSync(notFoundPath, staticNotFound, 'utf8')

console.log(`[postbuild] rss / sitemap / robots / .nojekyll 已生成（${articles.length} 篇文章）`)