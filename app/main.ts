import '../src/styles/index.less'
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import { articleIndex, loadArticleHtml, prerenderedArticle } from './lib/content'

const notFound = (path: string) => ({
  name: 'not-found',
  params: { pathMatch: path.split('/').filter(Boolean) },
})

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  ({ router }) => {
    router.beforeEach(async (to) => {
      if (to.name !== 'article') return
      const id = Number(to.params.id)
      if (!articleIndex.some((article) => article.meta.id === id)) return notFound(to.path)

      // 首屏：SSG 已渲染正文，直接从 DOM 捕获，不重复下载
      if (!import.meta.env.SSR && id === prerenderedArticle.id && prerenderedArticle.html) return

      try {
        await loadArticleHtml(id)
      } catch {
        return notFound(to.path)
      }
    })
  },
  { hydration: true },
)
