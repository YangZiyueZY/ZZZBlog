# Z-BLOG 重构计划：Astro 5 → Vue 3 + TypeScript（SSG）

> 状态：**计划稿**（本轮不改业务代码）
> 日期：2026-11-21
> 仓库：`/home/kingdove/ZZZBlog`
> 基线：Astro 5.18.2 / 14 篇文章 / base = `/ZZZBlog` / 纯静态托管（GitHub Pages）
> 已确认决策：**Vue 为主 + React 可选岛**；**预渲染 SSG**（不做 SPA，不做常驻 SSR）

---

## 0. 结论先行

1. **技术路线**：Vite 8 + Vue 3.5 + TypeScript 5.9 + Vue Router 4 + `vite-ssg` 预渲染；保留 Tailwind CSS 3 与现有 Less，保留 `src/content/articles/*.md` 与 PagesCMS 工作流，保留全部 URL 契约与 `/ZZZBlog` 子路径部署方式。
2. **不选 Nuxt**：Nuxt 是另一套元框架（约定式路由、Nitro 服务端层、模块生态），迁移面比“Vue + Vite”更大，且静态博客用不到其服务端能力。**不选 Vike**：它是“双框架整页并存”的解法，与已确认的“React 仅作可选岛”不匹配。**不选纯 SPA**：会牺牲首屏与 SEO，并在 GitHub Pages 子路径下引入 404 回退的额外复杂度。
3. **关键架构决策**：文章正文**按 id 拆成独立 chunk**；SSR 与客户端二次导航由路由守卫预取，**首屏直接从 SSG 已渲染的 DOM 捕获正文**，既不重复下载也不重复塞进 HTML 状态；正文不进入主包，避免包体随文章数线性增长。
4. **代价**：客户端会新增 Vue 运行时 + Router（约 40–60KB gzip，实测为准），这是相对 Astro “零框架运行时”的必然回退；文章页正文 chunk 与现有 HTML 体积相当。
5. **迁移方式**：新分支并行搭建，Astro 版本保留到视觉/功能全量对齐后再切换；不做数据迁移（Markdown 原地复用）。

---

## 1. 现状盘点

### 1.1 技术栈

| 层 | 现状 |
| --- | --- |
| 框架 | Astro 5.18.2（`output: 'static'`，无 adapter） |
| 样式 | Tailwind CSS 3.4.17 + PostCSS + Less（`main.less` / `markdown.less` / `components.less`） |
| 语言 | TypeScript 5.8.3；`astro check` 做类型检查 |
| 内容 | Content Collections（glob loader）+ zod schema，14 篇 `.md` |
| Markdown | Shiki（构建期）+ KaTeX + GFM；自定义 `rehype-image-attrs` 补图片尺寸与 base |
| 扩展 | `@astrojs/rss`、`@astrojs/sitemap`、`vite-plugin-pwa`（Workbox） |
| 部署 | GitHub Actions → Pages；另有 Netlify / Vercel 配置 |
| 内容管理 | Pages CMS（`.pages.yml`，文章路径 `src/content/articles`） |

### 1.2 页面与产物

| 路由 | 来源 | 说明 |
| --- | --- | --- |
| `/ZZZBlog/` | `astro.config.mjs` redirects | 301/静态跳转到 `/ZZZBlog/article/` |
| `/ZZZBlog/article/` | `src/pages/article/index.astro` | 瀑布流列表 + 搜索索引注入 |
| `/ZZZBlog/article/{id}/` | `src/pages/article/[id].astro` | 14 篇；正文 + 目录 + 图片预览 + 代码复制 |
| `/ZZZBlog/about/` | `src/pages/about.astro` | “快速手册”交互 |
| `/ZZZBlog/profile/` | `src/pages/profile.astro` | 个人主页 / 绳匠档案双视图 |
| `/ZZZBlog/404.html` | `src/pages/404.astro` | GitHub Pages 自定义 404 |
| `/ZZZBlog/rss.xml` | `src/pages/rss.xml.js` | RSS 2.0 |
| `/ZZZBlog/robots.txt` | `src/pages/robots.txt.ts` | 指向 sitemap |
| `/ZZZBlog/sitemap-index.xml` | `@astrojs/sitemap` | 构建期生成 |

- 内容总量：14 篇 Markdown（约 60KB），文章页单页 HTML 约 150KB。
- 构建基线（本机，dev server 同时运行）：18 个页面，约 123s，PWA 预缓存 57 项 / 2.64MiB。
- 依赖体量小、无 React/Vue 运行时；客户端脚本为 6 个原生 TS 模块。

### 1.3 迁移前必须处理

- 当前工作区有 **19 个未提交修改**（头像本地化、样式修复、搜索/瀑布流/目录等增强）以及未跟踪的 `.npmrc`。**先提交或建 worktree**，否则重构分支会覆盖这些改动。
- 现有 `dist/` 是 Astro 产物，切换后会被 Vite 覆盖；建议保留一份基线快照用于对比。

---

## 2. 技术选型与版本

### 2.1 核心版本（以当前 registry 为准，落地时锁定 lockfile）

| 包 | 版本 | 角色 | 说明 / 风险 |
| --- | --- | --- | --- |
| `vue` | 3.5.46 | UI 运行时 | 稳定版；3.6 尚在 rc |
| `vue-router` | 4.6.5 | 路由 | **刻意不用 5.x**：5.x 的 peer 依赖包含 Pinia/Vite，且 vite-ssg 虽支持，但生态配置改动更大 |
| `vite` | 8.3.8 | 构建 | Node ≥20.19/22.12；本机 Node 24.9 满足。**Vite 8 底层是 Rolldown + Lightning CSS**，产物行为与 Vite 7 有差异，P0 需验证 |
| `vite-ssg` | 28.3.0 | SSG | 支持 Vite 8、Router 4/5、`dirStyle: 'nested'`、`includedRoutes`、`base`；已核对源码 |
| `@vitejs/plugin-vue` | 6.0.11 | SFC 编译 | 支持 Vite 8 |
| `typescript` | 5.9.3 | 类型 | **不用 7.x**：新大版本工具链（vue-tsc/eslint）风险高 |
| `vue-tsc` | 3.3.14 | 类型检查 | 替代 `astro check` |
| `@vue/tsconfig` | 0.9.1 | TS 基础配置 | `tsconfig.dom.json` |
| `@unhead/vue` | 2.1.18 | head 管理 | 与 vite-ssg 28 内置的 `@unhead/vue ^2.1.2` 对齐，**不要装 3.x** |
| `tailwindcss` | 3.4.19 | 样式 | 按要求保持 v3，不升 v4 |
| `postcss` | 8.5.33 | 样式 | 沿用现配置 |
| `autoprefixer` | 10.7.0 | 样式 | 同上 |
| `less` | 4.9.1 | 样式 | 现有 Less 原样保留 |
| `vite-plugin-pwa` | 2.0.0 | PWA | 支持 Vite 8；与 vite-ssg 有官方协同（构建后重新生成 SW） |
| `workbox-build` / `workbox-window` | 7.4.1 | PWA | 二者都是 peer 依赖，需显式安装 |
| `zod` | 4.6.7 | frontmatter 校验 | 与 Astro 内置的 zod 3 有行为差异，需回归；可回退 `3.25.x` |
| `gray-matter` | 4.0.3 | 解析 frontmatter | 稳定 |
| `unified` | 11.0.5 | Markdown 管线 | — |
| `remark-parse` | 11.0.0 | 解析 | — |
| `remark-gfm` | 4.0.1 | 表格/任务列表 | 对齐 Astro 默认 |
| `remark-smartypants` | 3.0.3 | 智能标点 | 对齐 Astro 默认，避免引号/破折号差异 |
| `remark-math` | 6.0.0 | 公式 | 沿用 |
| `remark-rehype` | 11.1.2 | 转换 | `allowDangerousHtml` |
| `rehype-raw` | 7.0.0 | 允许正文 HTML | 现有文章无裸 HTML，但保持 Astro 兼容 |
| `rehype-slug` | 6.0.0 | 标题锚点 | 与 Astro 一致（github-slugger，中文保留） |
| `rehype-katex` | 7.0.1 | 公式渲染 | — |
| `rehype-stringify` | 10.0.1 | 序列化 | — |
| `shiki` / `@shikijs/rehype` | 4.6.0 | 代码高亮 | 构建期，不下发客户端；需补 `data-language` |
| `katex` | 0.16.22 | 公式样式 | **保持现版本**，避免 0.19 的样式/字体差异 |
| `image-size` | 2.0.2 | 图片尺寸 | 沿用 |
| `unist-util-visit` | 5.1.0 | AST 遍历 | 沿用 |
| `feed` | 6.0.0 | RSS 生成 | 替代 `@astrojs/rss` |
| `tsx` | 4.23.15 | 运行生成脚本 | 让内容脚本直接 import TS schema |
| `@types/node` | 24.19.2 | Node 类型 | 与 Node 24 基线对齐 |
| `eslint` | 9.39.5 | Lint | 沿用 |
| `eslint-plugin-vue` | 10.12.1 | Vue 规则 | 替代 `eslint-plugin-astro` |
| `vue-eslint-parser` | 10.4.2 | Vue 解析 | — |
| `typescript-eslint` | 8.68.0 | TS 规则 | 沿用 |

React 可选岛（**只在首次真正使用时安装**）：

| 包 | 版本 | 说明 |
| --- | --- | --- |
| `react` / `react-dom` | 19.3.1 | 岛内运行时 |
| `@vitejs/plugin-react` | 6.3.0 | 支持 Vite 8；peer 中的 oxc/babel 为可选 |
| `@types/react` / `@types/react-dom` | 19.3.0 | 类型 |

### 2.2 版本策略

- `package.json` 使用精确版本（或 `~x.y.z`），提交 `pnpm-lock.yaml`；CI 用 `--frozen-lockfile`。
- **P0 必须先做兼容性冒烟**：最小工程已验证 `vite@8 + vite-ssg@28 + vue-router@4.6 + plugin-vue@6 + base '/ZZZBlog/' + dirStyle nested` 可构建（见附录 A.1）；**尚未验证** PWA、Tailwind/Less、真实 Markdown 管线。任一项失败则按降级矩阵调整（Vite 7.3.x + plugin-vue 6.x + 兼容的 vite-ssg）。
- Node 基线：本机 24.9.0，CI 用 Node 24；`packageManager` 保持 `pnpm@10.11.0`。

---

## 3. 总体架构

### 3.1 构建期

```text
src/content/articles/*.md
        │  tsx scripts/build-content.ts
        │  （gray-matter → zod 校验 → unified 渲染 → 统计/目录/搜索索引）
        ▼
.content/
  index.json              # 列表/详情 meta + 字数/阅读时长 + headings
  articles/<id>.json      # 仅正文 html（SSR / 二次导航懒加载）
  search-index.json       # 搜索：标题 + 正文纯文本
  routes.json             # SSG 路由枚举（含全部文章 id）
        │
        ▼
vite-ssg build
  ├─ client build（Vue 运行时 + 路由 + 页面 chunk）
  ├─ server build（逐路由 renderToString）
  └─ 生成 dist/**（nested：/article/1/ → article/1/index.html）
        │
        ▼
scripts/postbuild.mjs
  rss.xml / sitemap-index.xml / sitemap-0.xml / robots.txt / .nojekyll
```

### 3.2 运行期

```text
index.html  →  src/main.ts  →  ViteSSG(App, { routes, base })
                                  │
                                  ├─ 首屏：从 [data-article-body] 捕获已渲染正文（零额外请求）
                                  ├─ router.beforeEach：SSR / 二次导航才懒加载正文 chunk
                                  ├─ router.isReady()
                                  └─ hydrate（首屏 HTML 与客户端数据同源，无 mismatch）
```

**为什么用路由守卫预取正文**：

- 避免在组件里用 `async setup` + `<Suspense>`（SSG 下异步边界容易产生空渲染/闪烁）。
- **首屏不重复下载正文**：SSG HTML 已有完整正文，客户端在 `ViteSSG` 创建前从 `[data-article-body]` 捕获 `innerHTML` 作为初始值；路由守卫只在 `import.meta.env.SSR` 或“客户端二次导航”时加载正文 chunk。这样首屏字节不会翻倍。
- 守卫在 `router.isReady()` 之前完成，SSG 渲染与客户端首屏拿到的数据完全一致，hydration 稳定。
- 已核对 `vite-ssg` 源码：客户端会先 `await router.isReady()` 再 `mount`，且 `ViteSSGClientOptions.hydration: true` 时使用 `createSSRApp` + `mount(el, true)` 进行 hydration；**默认 false 会新建客户端 app 重渲染**，必须显式开启。
- 每篇文章一个 JSON chunk，客户端只在进入该文章时下载几十 KB，不随文章总数膨胀。
- 列表页只依赖 `index.json`（14 篇的 meta，几十 KB 以内）。

### 3.3 状态与数据

- 不引入 Pinia：只有一个只读内容缓存模块 `src/lib/content-store.ts`（`Map<number, string>` + `loadArticleHtml(id)`），天然 SSR 安全、无跨请求可变状态。
- **构建期时间单点注入**：`vite.define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) }`；`AppAuthor` 的等级/经验、`ProfilePage` 的等级/天数/签名日期全部从它派生。vite-ssg 的 client/server 两次 build 复用同一份 resolved config，值一致；禁止在组件顶层直接 `new Date()`。
- 搜索索引按需加载（首次聚焦/输入时 `import('../../.content/search-index.json')`），由 Vite 打成独立 chunk，PWA 的 `js` 预缓存规则会自动覆盖，离线也能搜索；避免 Astro 时代每页内联约 20KB 的做法。

---

## 4. 目录结构与迁移映射

### 4.1 目标目录

迁移期采用 **Vue 应用独立在 `app/`、共享层留在 `src/`** 的方式，让 Astro 与 Vue 两套页面可以在同一分支共存（Astro 只扫描 `src/pages`，不会误把 `.vue` 当路由）。P5 切换后可以选择把 `app/` 移到 `src/`，或保持现状。

```text
ZZZBlog/
├── index.html                     # Vite 入口壳（<div id="app">）
├── vite.config.ts                 # base / plugins / ssgOptions / PWA
├── tsconfig.json                  # 迁移期可另加 tsconfig.vue.json
├── eslint.config.mjs
├── app/                           # Vue 应用（P1 起）
│   ├── main.ts                    # ViteSSG 入口、样式导入
│   ├── App.vue                    # RouterView
│   ├── env.d.ts
│   ├── router/index.ts
│   ├── layouts/DefaultLayout.vue
│   ├── pages/
│   │   ├── ArticleListPage.vue
│   │   ├── ArticleDetailPage.vue
│   │   ├── AboutPage.vue
│   │   ├── ProfilePage.vue
│   │   ├── NotFoundPage.vue
│   │   └── RedirectPage.vue
│   ├── components/
│   │   ├── AppBackground.vue
│   │   ├── AppHeader.vue
│   │   ├── AppFooter.vue
│   │   ├── AppAuthor.vue
│   │   ├── SearchBox.vue
│   │   ├── ArticleCard.vue
│   │   ├── ArticleToc.vue
│   │   ├── ImagePreviewModal.vue
│   │   └── AboutBook.vue
│   ├── composables/
│   │   ├── useSearch.ts
│   │   ├── useMasonry.ts
│   │   ├── useArticleToc.ts
│   │   ├── useImagePreview.ts
│   │   ├── useCodeCopy.ts
│   │   ├── useBackButton.ts
│   │   ├── useFooterReveal.ts
│   │   └── useProfilePage.ts
│   └── react/                     # 可选岛（按需启用）
│       ├── mount.ts
│       └── components/
├── scripts/
│   ├── build-content.ts           # Markdown → .content
│   ├── postbuild.mjs              # RSS / sitemap / robots / .nojekyll
│   └── gen-pwa-icons.mjs          # 原样保留
├── src/                           # 共享层 + Astro 原文件（P5 清理）
│   ├── content/
│   │   ├── schema.ts              # Vue 构建脚本用的 zod schema
│   │   ├── content.config.ts      # 迁移期保留，切换后删除
│   │   └── articles/*.md          # 原地不动
│   ├── config/site.ts             # 共享，原地不动
│   ├── constants/nav.ts           # Astro 侧；Vue 侧用 app/constants/nav.ts
│   ├── data/about.ts              # 共享
│   ├── types/                     # 共享
│   ├── lib/                       # articles / rehype-image-attrs / content-store
│   ├── styles/                    # main.less / markdown.less / components.less
│   ├── components/ layouts/ pages/ scripts/   # Astro 原文件，P5 删除
└── .content/                      # 构建产物，gitignore
```

### 4.2 逐文件映射

> 下表中 Vue 侧目标文件均位于 `app/`（迁移期与 Astro 的 `src/` 共存）；共享的 config/data/types/styles/lib 仍来自 `src/`。

| 现有 | 目标 | 迁移要点 |
| --- | --- | --- |
| `src/layouts/BaseLayout.astro` | `app/layouts/DefaultLayout.vue` | props 同名；head 改用 `useHead`；slot 保留；`class:list` → `:class` |
| `src/components/AppBackground.astro` | `AppBackground.vue` | 纯静态，直接转模板 |
| `AppHeader.astro` | `AppHeader.vue` | 搜索索引改为外部 json；导航激活态用 `useRoute()`；移动菜单用 `ref` |
| `SearchBox.astro` | `SearchBox.vue` + `useSearch.ts` | 三种 variant 保留；键盘选择/高亮逻辑平移 |
| `ArticleCard.astro` | `ArticleCard.vue` | 图片尺寸改为构建期写入 `index.json`（**不再在组件里 readFileSync**） |
| `AppAuthor.astro` | `AppAuthor.vue` | 等级/经验改用 `__BUILD_TIME__`，消除 hydration 差异 |
| `AppFooter.astro` | `AppFooter.vue` | 原样 |
| `AboutBook.astro` | `AboutBook.vue` | 原生 DOM 状态机 → `ref/computed`，交互语义不变 |
| `pages/article/index.astro` | `ArticleListPage.vue` | `getCollection` → `index.json`；瀑布流 onMounted |
| `pages/article/[id].astro` | `ArticleDetailPage.vue` | `getStaticPaths` → SSG 路由枚举；`<Content />` → `v-html`；目录由 `headings` 渲染 |
| `pages/about.astro` | `AboutPage.vue` | 套 `DefaultLayout` |
| `pages/profile.astro` | `ProfilePage.vue` | 文章数来自 `index.json`；等级/天数/签名日期统一从 `__BUILD_TIME__` 派生（**禁止组件顶层 `new Date()`**） |
| `pages/404.astro` | `NotFoundPage.vue` | SSG 输出为 `dist/404.html` |
| `pages/rss.xml.js` | `scripts/postbuild.mjs` | 用 `feed` 生成；链接带 base |
| `pages/robots.txt.ts` | `scripts/postbuild.mjs` | 文本生成 |
| `lib/articles.ts` | 原样复用 | 构建脚本调用 |
| `lib/rehype-image-attrs.mjs` | 原样复用 | 作为 unified 插件使用 |
| `scripts/search.ts` | `useSearch.ts` | 去掉全局 `dataset.searchInit`，组件化 |
| `scripts/masonry.ts` | `useMasonry.ts` | 模板 ref + `nextTick`，重试/IO 逻辑保留 |
| `scripts/article-toc.ts` | `useArticleToc.ts` | `matchMedia` 移入 `onMounted`，避免 SSR 访问 window |
| `scripts/article-detail.ts` | `useImagePreview` / `useCodeCopy` / `useBackButton` / `useFooterReveal` | 拆成单一职责 |
| `scripts/about-book.ts` | `AboutBook.vue` 内部逻辑 | 不再用 data-role 查 DOM |
| `scripts/profile.ts` | `useProfilePage.ts` | 状态化；剪贴板/菜单/滚动保留 |
| `constants/nav.ts` | `app/constants/nav.ts` | **改存裸路径**（`/article/`、`/about/`），渲染用 `<RouterLink>`；不再预先 `withBase` |
| `styles/*.less` | 原样 | 仅新增 `index.less` 汇总导入 |
| `content.config.ts` | 迁移期保留；Vue 侧另建 `content/schema.ts` | **迁移期双写**：Astro 继续用 `astro:content` 的 `z`，Vue 构建脚本用独立 zod schema；P5 删除 Astro 后合并 |

---

## 5. 路由、`/ZZZBlog` base 与 GitHub Pages

### 5.1 路由表

```ts
// src/router/index.ts（示意）
const routes = [
  { path: '/', name: 'root', component: RedirectPage, meta: { redirect: '/article/' } },
  { path: '/article/', name: 'articles', component: ArticleListPage },
  { path: '/article/:id/', name: 'article', component: ArticleDetailPage },
  { path: '/about/', name: 'about', component: AboutPage },
  { path: '/profile/', name: 'profile', component: ProfilePage },
  { path: '/404/', name: 'not-found', component: NotFoundPage },
  { path: '/:pathMatch(.*)*', name: 'catch-all', component: NotFoundPage },
]
```

- **尾斜杠统一**：所有站内路由以 `/` 结尾，配合 `dirStyle: 'nested'` 输出目录式 HTML，保持现有 URL 契约。
- **catch-all 不参与 SSG**（默认过滤 `*`）；直接访问不存在的地址由 GitHub Pages 的 `404.html` 兜底，站内错误跳转由该路由渲染。
- **正文加载失败**：路由守卫捕获 `loadArticle(id)` 异常 → `return { name: 'not-found', params: { pathMatch: to.path.split('/') } }`；直接访问不存在的 id 仍由静态 `404.html` 兜底（两套路径行为需在验收中分别覆盖）。
- **详情页复用**：`<RouterView :key="$route.path" />`（或详情页 `:key="route.params.id"`），否则 `/article/1/` → `/article/2/` 会复用实例，目录/复制/图片预览仍停留在旧文章。
- **滚动行为**：`scrollBehavior` 处理前进/后退恢复；文章详情页的“桌面双面板滚动”由页面自身逻辑接管。

### 5.2 base 规则（最容易出错的地方）

`siteConfig.base = '/ZZZBlog'` **仍是唯一来源**。

| 场景 | 是否加 base | 做法 |
| --- | --- | --- |
| Vite 资源 | 是 | `base: withBase('/')`（即 `/ZZZBlog/`） |
| Router history | 是 | `createWebHistory(import.meta.env.BASE_URL)` |
| `<RouterLink>` | **否** | Router 自动加 base，`to` 只写 `/article/` |
| 普通 `<a href>` 站内页面 | 是 | `withBase('/about/')` |
| `<img src="/img/...">` | 是 | `withBase(...)` |
| Markdown 内图片 | 是 | 构建期 `rehype-image-attrs` 统一加 |
| canonical / OG / JSON-LD | 是 | `siteConfig.site + withBase(route.path)` |
| RSS / sitemap / robots | 是 | postbuild 统一用 `withBase` |
| CSS 内图标 | 是 | 继续用 CSS 变量注入（App 根节点 `:style`） |
| `nav.ts` / 搜索索引里的 `url` | **否** | 存裸路径；渲染时 `RouterLink` 或 `withBase()` 二选一 |

> 禁止在 `<RouterLink>` 上再调用 `withBase`，否则会得到 `/ZZZBlog/ZZZBlog/...`。现有 `src/constants/nav.ts` 与 `AppHeader` 的搜索 `url` 都内嵌了 `withBase`，迁移时必须改存裸路径；构建后加 `grep -R '/ZZZBlog/ZZZBlog' dist` 门禁。

### 5.3 SSG 配置

```ts
// vite.config.ts（示意）
export default defineConfig({
  base: withBase('/'),        // '/ZZZBlog/'
  // ssgOptions.base 与 Vite base 保持一致，避免两次 build 的 base 漂移
  server: { host: true, port: 4321 },
  plugins: [vue(), VitePWA({ /* 见 §10 */ })],
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'minify',
    // 关键：404 静态化（去脚本），见下方说明
    onPageRendered: (route, html) => route === '/404/' ? stripScripts(html) : html,
    beastiesOptions: false,   // 先关闭，避免与现有 CSS 优先级打架；后续可开
    includedRoutes: (paths) => [
      ...paths.filter(p => !p.includes(':') && !p.includes('*')),
      ...articleIds.map(id => `/article/${id}/`),
    ],
    htmlFileName: file => (file === '404/index.html' ? '404.html' : undefined),
  },
})
```

- `vite-ssg` 的 `includedRoutes` 在 **server build 之后**执行，可以直接读 `.content/routes.json`（或通过 `includedRoutes` 导出函数）；`articleIds` 即从该文件读取。
- `stripScripts` 最小实现（只为 404 服务）：
  ```ts
  const stripScripts = (html: string) => html
    .replace(/<script\b[^>]*type="module"[^>]*>\s*<\/script>/g, '')
    .replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')
  ```
- `htmlFileName` 把 `/404/` 的 nested 输出改名成根级 `404.html`（GitHub Pages 约定）。
- **`404.html` 必须静态化**：vite-ssg 默认会把入口 `<script type="module">` 与 `modulepreload` 注入**每一条**路由（已用冒烟工程确认）。GitHub Pages 对任意不存在的 URL 都返回这份 HTML，但浏览器地址不变；若保留 SPA 脚本，会在错误 URL 上启动 router，造成守卫失败/hydration 不一致。用 `onPageRendered` 对 `/404/` 移除 module script 与 modulepreload，只保留 HTML/CSS，得到真正的静态 404；该页 head 加 `noindex`，不要输出指向 `/ZZZBlog/404/` 的 canonical。
- `vite-ssg` 写文件时使用路由路径、不会把 base 写进目录，因此 `dist/` 仍是站点根，部署到 `/ZZZBlog/` 后路径正确（已核对源码 `src/node/build.ts`）。
- 客户端入口示意：
  ```ts
  export const createApp = ViteSSG(
    App,
    { routes, base: import.meta.env.BASE_URL },
    ({ router }) => {
      router.beforeEach(async (to) => { /* 文章路由预取 */ })
    },
    { hydration: true },
  )
  ```

### 5.4 产物结构

```text
dist/
├── index.html                 # / → meta refresh 到 /ZZZBlog/article/
├── 404.html
├── article/index.html
├── article/1/index.html … article/14/index.html
├── about/index.html
├── profile/index.html
├── assets/…                   # Vite 产物，引用带 /ZZZBlog/
├── img/ icon/ …               # public 原样复制
├── rss.xml
├── sitemap-index.xml
├── sitemap-0.xml
├── robots.txt
├── sw.js / workbox-*.js
├── manifest.webmanifest
└── .nojekyll
```

### 5.5 部署配置调整

- **GitHub Actions**：`pnpm install --frozen-lockfile` → `pnpm check` → `pnpm build` → 上传 `dist`；Node 24。`upload-pages-artifact` 不变。
- **Netlify**：`build.command` / `publish` 不变；`NODE_VERSION` 提到 24。
- **Vercel**：`framework` 从 `astro` 改为 `null`（或删除），`buildCommand` / `outputDirectory` 不变。
- **Pages CMS**：文章路径与 frontmatter 不变，`.pages.yml` 仅更新注释（如“正文由 Vue 管线渲染”）。
- **根跳转**：`RedirectPage` 用 `useHead` 输出 `<meta http-equiv="refresh" content="0;url=/ZZZBlog/article/">`、`noindex`、canonical，并在客户端 `router.replace`，与 Astro 现有产物一致。

---

## 6. 内容层迁移

### 6.1 不变的部分

- Markdown 文件位置、文件名（`1.md`…`14.md`）、frontmatter 字段与默认值全部不变。
- Pages CMS 配置与写作流程不变。
- `id` 仍是数字，决定 URL `/article/{id}/`；列表仍按 `id` 升序。
- 字数/阅读时长算法（中文按字、英文按词、300 字/分钟）原样复用 `src/lib/articles.ts`。

### 6.2 schema 拆分

```ts
// src/content/schema.ts（新）
import { z } from 'zod'

// 注意：迁移期不要把它 import 进 astro 的 content.config.ts（Astro 5 内部是 zod 3，
// defineCollection 只能接收 astro:content 导出的 z；混用会导致类型与 JSON schema 生成失效）。
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
```

- **迁移期双写 schema**：`src/content.config.ts` 保持现状（继续用 `astro:content` 的 `z`）；`src/content/schema.ts` 只给 Vue 构建脚本用（zod 4）。两边字段必须保持一致，P5 删除 Astro 后再合并为一份。
- **zod 4 回归点**：`default()` 行为、错误信息结构（`error.issues`）、`safeParse` 返回值；若出现兼容问题，回退 `zod@3.25.x`。
- 不建议“让 Astro 直接 import zod4 schema”：Astro 5 依赖 zod 3，`defineCollection` 的类型与 JSON schema 生成都绑定自身 zod 实例，混用会静默降级。

### 6.3 构建脚本 `scripts/build-content.ts`

步骤：

1. `fast-glob` / `node:fs` 读取 `src/content/articles/*.md`。
2. `gray-matter` 解析；`articleSchema.safeParse` 校验；失败时输出 `文件:字段:原因` 并 **非零退出**。
3. 校验：`id` 唯一、`cover[0]` 文件存在（缺失只告警，保留原渲染行为）、时间字符串格式。
4. `unified` 渲染为 HTML（见 §7），同时抽取全部 `h1–h6`（与 Astro `headings` 同口径），TOC 渲染时只取 `h2/h3`。
5. `articleStats()` 计算字数/阅读时长。
6. 输出：
   - `.content/index.json`：`[{ meta, coverSize, wordCount, readingTime, headings }]`（按 id 升序；`coverSize` 由 `image-size` 在构建期读取，替代现在 `ArticleCard.astro` 里的 `readFileSync`；`headings` 很小，随 index 一起进主包，首屏目录无需额外 chunk）。
   - `.content/articles/{id}.json`：`{ html }`（仅正文，供 SSR 与客户端二次导航懒加载）。
   - `.content/search-index.json`：`{ id, title, url, desc, text }`（正文纯文本截取 1500 字，规则与现有 `AppHeader` 完全一致）。
   - `.content/routes.json`：`['/', '/article/', '/about/', '/profile/', '/404/', '/article/1/', …]`。
7. **开发期**：写一个极简 Vite 插件监听 `src/content/articles/**`，变更时重跑脚本并 `server.ws.send({ type: 'full-reload' })`；内容变更频率低，全量刷新可接受。
8. **缓存**：脚本对单篇渲染结果做 mtime/hash 缓存（可选）；14 篇全量渲染预计 <2s，先不做缓存也可。

### 6.4 读取方式

| 位置 | 读取 | 说明 |
| --- | --- | --- |
| 列表页 | `import index from '../../.content/index.json'` | 进入主包（meta + headings，很小） |
| 详情页首屏 | 从已渲染 DOM 捕获 `[data-article-body].innerHTML` | **不额外下载正文 chunk**；在 `ViteSSG` 创建前捕获 |
| 详情页 SSR | 路由守卫 `loadArticleHtml(id)` | Node 侧懒加载 `.content/articles/{id}.json` |
| 详情页二次导航 | 路由守卫 `loadArticleHtml(id)` | 客户端懒加载单篇 chunk |
| 搜索 | 首次聚焦时动态 `import('../../.content/search-index.json')` | 独立 chunk；失败降级为“无结果”，不阻塞页面 |
| SSG 路由 | `scripts/postbuild`/`vite.config` 读 `routes.json` | 构建期 Node 读取 |
| OG/JSON-LD | 详情页 meta | 来自 `index.json` |

**首屏捕获示意（`src/main.ts`）**：

```ts
// 在 ViteSSG(...) 调用之前执行；SSR 阶段为 undefined
export const prerenderedBody = import.meta.env.SSR
  ? ''
  : document.querySelector<HTMLElement>('[data-article-body]')?.innerHTML ?? ''
```

- 守卫逻辑：
  ```ts
  router.beforeEach(async (to) => {
    if (to.name !== 'article') return
    const id = Number(to.params.id)
    const isInitial = !import.meta.env.SSR && stripBase(to.path) === stripBase(location.pathname)
    if (!isInitial) await loadArticleHtml(id)   // SSR 与客户端二次导航
  })
  ```
- 详情页组件：`const html = computed(() => articleHtmlCache.get(id) ?? (isInitialRoute ? prerenderedBody : ''))`。
- 若捕获失败（例如直接访问非文章页），回退为正常懒加载；不影响功能，只是多一次请求。
- 容器同时输出 `data-article-id`，捕获时校验与路由参数一致；浏览器对 HTML 的序列化归一（属性顺序/自闭合）可能造成极小差异，若 hydration 告警则回退为加载正文 chunk（功能不受影响）。

> 生成脚本写出的 `.content/` 必须加入 `.gitignore`（已加入 `.content/` 与 `.vite-ssg-temp/`）。

---

## 7. Markdown 渲染、代码高亮与 KaTeX

### 7.1 管线

```ts
const html = await unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSmartypants)          // 对齐 Astro 默认
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)                  // 现有文章无裸 HTML，保持兼容
  .use(rehypeSlug)                 // 与 Astro 相同的 github-slugger 锚点
  .use(rehypeShiki, { theme: 'github-dark' })
  .use(rehypeDataLanguage)         // 补 <pre data-language="js">，见下
  .use(rehypeKatex)
  .use(rehypeImageAttrs, { base: '/ZZZBlog' })
  .use(rehypeStringify, { allowDangerousHtml: true })
  .process(markdown)
```

**已实测**：`@shikijs/rehype@4.6` 输出 `<pre class="shiki github-dark" style="..." tabindex="0">`，**没有** Astro 的 `data-language`，也**没有** `overflow-x: auto` 内联样式。因此需要：

```ts
import { visit } from 'unist-util-visit'

// 从 <code class="language-js"> 提取语言，写回 <pre data-language>
function rehypeDataLanguage() {
  return (tree) => visit(tree, 'element', (node) => {
    if (node.tagName !== 'pre') return
    const code = node.children.find((c) => c.type === 'element' && c.tagName === 'code')
    const cls = code?.properties?.className ?? []
    const lang = Array.isArray(cls) ? cls.find((c) => c.startsWith('language-'))?.slice(9) : undefined
    if (lang) node.properties = { ...node.properties, 'data-language': lang }
  })
}
```

并给 `markdown.less` 的 `pre` 增加 `overflow-x: auto`（或让 Shiki 输出该样式），否则长代码行会撑破正文面板。

### 7.2 逐项对齐表

| Astro 现状 | Vue 方案 | 验收点 |
| --- | --- | --- |
| 标题 id（`一级标题`、`二级标题`…） | `rehype-slug` | 新旧 HTML 的 `id` 一一相同，含重复标题 `-1` 后缀 |
| Shiki `<pre class="astro-code github-dark" data-language="js">` | `@shikijs/rehype` + `rehypeDataLanguage` 补 `data-language` | `pre::before` 语言标签可见；背景仍被 Less 覆盖为纯黑；**已实测缺 data-language** |
| KaTeX 公式 | `remark-math` + `rehype-katex` + `katex/dist/katex.min.css` | 行内/独立公式渲染一致；长公式可横向滚动 |
| 图片 `width/height` + base | 复用 `rehype-image-attrs.mjs` | 中文文件名解码正确；无 CLS。**注意插件用 `process.cwd()` 定位 `public/`**：构建脚本必须从项目根运行，或给插件加 `publicDir` 参数（推荐显式传入） |
| GFM 表格/任务列表 | `remark-gfm` | 表格样式与现在一致 |
| 智能标点 | `remark-smartypants` | 与现有 HTML 做 diff，确认无意外替换 |
| 目录 | AST 遍历全部标题，TOC 过滤 `depth 2–3` | 顺序、层级、文本与 Astro `headings` 一致；锚点与 `rehype-slug` 输出一致 |
| 代码块横向滚动 | `markdown.less` 的 `pre { overflow-x: auto; }` | 长代码行可横向滚动，不撑破面板（Astro 原为 Shiki 内联样式） |
| 代码复制按钮 | 客户端 `useCodeCopy` | 注入位置/样式不变 |
| 图片放大 | 客户端 `useImagePreview` | 事件委托、Esc、遮罩关闭一致 |

> 安全：正文来自本地仓库，属于可信内容；`v-html` 可接受。如未来接入外部 Markdown，必须加 `rehype-sanitize`。

---

## 8. 样式沿用 Tailwind CSS 3

- 三个 Less 文件原样保留，新增 `src/styles/index.less` 只做汇总：
  ```less
  @import './main.less';
  @import './markdown.less';
  @import './components.less';
  ```
- `main.less` 中的 `@tailwind base/components/utilities` 继续由 PostCSS 处理；Vite 支持 Less → PostCSS 链路。
- `tailwind.config.ts` 建议从 `module.exports` 改为 `export default`（项目 `type: module`，Vite 下更稳）；`content` 改为：
  ```ts
  content: ['./index.html', './src/**/*.{vue,ts,tsx,md,html}']
  ```
  现有配置已包含 `vue`，迁移时确认即可。
- **不要**升级 Tailwind 4：其配置方式（CSS-first）与现有 `tailwind.config.ts`、`@tailwind` 指令不兼容，会扩大改造面。
- 动态 class 注意：Vue 模板里的 `:class` 只要类名是字符串字面量，Tailwind 仍能扫描到；避免 `'text-' + size` 这类拼接。必要时用 `safelist`。
- `v-html` 渲染的 Markdown 不使用 Tailwind 工具类，全部依赖 `markdown.less`，不受 purge 影响。
- CSS 变量（图标 URL）：在 `App.vue` 根节点绑定 `:style="iconVars"`（所有后代可用），或通过 `useHead({ bodyAttrs: { style } })` 保持挂在 `body` 上。
- 文章页 `html/body overflow: hidden`：从 `[id].astro` 的全局 `<style>` 移到 Less 的 `.article-view` 规则，并由 `useHead({ htmlAttrs/bodyAttrs: { class: 'article-view' } })` 在详情页添加、离开时移除。
- 保留 `prefers-reduced-motion`、滚动条、`:root` 变量等原样规则。

---

## 9. 交互迁移清单

| 现有脚本 | 目标 | 关键行为 | 迁移风险 |
| --- | --- | --- | --- |
| `search.ts` | `useSearch.ts` + `SearchBox.vue` | 标题/正文过滤、命中片段高亮、上下键、Enter、Esc、点外关闭 | 高亮 HTML 用 `v-html`，必须继续转义；索引改为异步加载后需处理竞态 |
| `masonry.ts` | `useMasonry.ts` | 按卡片高度算 `grid-row span`、图片失败重试 2 次、IO 兜底 eager | 卡片 ref 注册时机；路由切换后重新初始化；字体/图片加载后重算 |
| `article-toc.ts` | `useArticleToc.ts` + `ArticleToc.vue` | 桌面独立滚动列、点击只滚正文、滚动高亮、移动端浮层、设备切换复位 | `matchMedia` 只能在 `onMounted`；SSG 下不能顶层访问 window |
| `article-detail.ts` | 4 个 composable | 返回键闪烁、图片 modal、代码复制、页脚滑入 | modal 的 DOM 引用；ResizeObserver/scroll 监听清理；切文章后重新注入复制按钮 |
| `about-book.ts` | `AboutBook.vue` | 分组/栏目/卡片三级切换、键盘左右、友链“前往” | 原逻辑依赖 DOM 索引，改为 `ref` 后需保持“切栏目重置卡片”语义 |
| `profile.ts` | `useProfilePage.ts` | 双视图切换、UID 复制、更多菜单、分享复制、权益滚动 | 剪贴板权限失败态保留 |

> 所有 `document/window` 访问必须在 `onMounted` 或事件回调中；SSG/SSR 阶段只渲染静态结构。
> **详情页复用**：`<RouterView :key="$route.path" />` 或详情页 `:key="route.params.id"`；所有 composable 在 `onBeforeUnmount` 里 `disconnect()` IntersectionObserver/ResizeObserver、移除 document 级监听，避免切文章后旧逻辑继续生效。
> **搜索索引**：缓存动态 `import()` 的 Promise（单例），避免快速聚焦/输入触发多次加载；索引 URL 为裸路径，跳转时按用途决定 `router.push` 或 `withBase`。

---

## 10. SEO、RSS、Sitemap 与 PWA

### 10.1 head（`@unhead/vue`）

在 `DefaultLayout.vue` 统一处理，字段与 `BaseLayout.astro` 一一对应：

- `title`、`description`、`keywords`
- `canonical` = `siteConfig.site + withBase(route.path)`
- `og:site_name/title/description/url/type/image`、`article:published_time/modified_time`
- `twitter:card`
- `link rel=icon/apple-touch-icon/alternate RSS`
- JSON-LD：全站 `WebSite`；文章页 `Article` + `WebSite`（`@graph`），`<` 转义为 `\u003c`
- 404 页 `noindex`；根跳转页 `noindex` + meta refresh

### 10.2 RSS（`feed@6`）

`scripts/postbuild.mjs`：

- `site` = `siteConfig.site + withBase('/')`
- 条目：`title/description/link/pubDate/categories/author`
- 链接一律 `withBase('/article/{id}/')`
- 顺序保持现有 `id` 升序（如需改为倒序，在计划确认项中定）
- 输出 `dist/rss.xml`，保留 `<link rel="alternate">`

### 10.3 Sitemap 与 robots

- 用 `routes.json` 生成 `sitemap-0.xml`，再生成 `sitemap-index.xml`（保留现有 URL，robots 不用改路径）；**排除根跳转 `/`、`/404/` 与 catch-all**，只保留 `/article/`、14 篇文章、`/about/`、`/profile/`。
- `robots.txt` 内容与现在一致，`Sitemap: {site}{withBase('/sitemap-index.xml')}`。
- 可选：为文章加 `lastmod`（来自 `modifiedTime`），Astro 版本目前没有，先不加，避免不必要的差异。

### 10.4 PWA（`vite-plugin-pwa@2`）

- 配置平移现有 `VitePWA`：`registerType: 'autoUpdate'`、`injectRegister: 'auto'`、manifest（`start_url` / `scope` 带 base）、`workbox.globPatterns` 保持 `**/*.{js,css,html,webp,png,ico,svg,woff2}`、`navigateFallback: null`、导航 `NetworkFirst`。
- `vite-ssg` 会在页面渲染完后调用 `pwaPlugin.generateSW()` 重新生成 SW；RSS/sitemap 在 postbuild 才生成，**不纳入预缓存**（与现状一致）。搜索索引作为 JS chunk 会被 `js` 规则预缓存。
- 子路径 scope：SW 注册在 `/ZZZBlog/sw.js`，scope `/ZZZBlog/`；用 `vite preview` 在 `/ZZZBlog/` 下验证安装与离线。
- 图标沿用 `public/pwa-192.png`、`pwa-512.png`；`gen-pwa-icons.mjs` 保留。

---

## 11. React 可选岛（按确认的“Vue 为主 + 可选扩展”）

### 11.1 约束

- 默认构建**不包含** React 运行时；只有真正使用岛的页面才下载 React chunk。
- 岛内**不做 SSR**：SSG 输出占位 DOM，客户端挂载后渲染；因此**岛内容不参与 SEO**，只用于交互型小部件（计算器、筛选器、可视化等）。
- 与 Vue 的通信：props 传入可序列化数据；事件用 `CustomEvent` 或回调 props；不共享响应式 store。
- SEO 关键内容仍用 Vue/静态 HTML 渲染。

### 11.2 实现草案

```vue
<!-- src/components/ReactIsland.vue -->
<script setup lang="ts">
const props = defineProps<{ name: string; props?: Record<string, unknown> }>()
const host = ref<HTMLElement>()
let unmount: (() => void) | undefined

onMounted(async () => {
  if (!host.value) return
  const { mountReact } = await import('../react/mount') // 独立 chunk
  unmount = mountReact(props.name, host.value, props.props ?? {})
})
onBeforeUnmount(() => unmount?.())
</script>

<template>
  <ClientOnly>
    <div ref="host" data-react-island />
    <template #placeholder><div data-react-island-placeholder /></template>
  </ClientOnly>
</template>
```

```ts
// src/react/mount.ts
import { createRoot } from 'react-dom/client'
const registry = import.meta.glob('./components/*.tsx') // 每个组件独立 chunk
export function mountReact(name: string, el: HTMLElement, props: object) {
  const load = registry[`./components/${name}.tsx`]
  if (!load) throw new Error(`Unknown island: ${name}`)
  let root: ReturnType<typeof createRoot> | undefined
  load().then((mod: any) => {
    root = createRoot(el)
    root.render(React.createElement(mod.default, props))
  })
  return () => root?.unmount()
}
```

- 需要时安装：`react`、`react-dom`、`@vitejs/plugin-react`、`@types/react`、`@types/react-dom`；`vite.config.ts` 加 `react()`（只影响 `.tsx`）。
- 验收：`grep -r "react-dom" dist/assets` 只在独立 chunk 出现；首页主包体积不因此变化。
- 若未来要“整页 React”，当前方案不适用，应评估 Vike 或 MPA 双入口；这是明确的架构分叉点。

---

## 12. 分阶段实施

> 估算为单人投入，可按阶段并行；每阶段都必须有可运行产物，禁止“大爆炸式”切换。

### P0 基线与冒烟（0.5 天）

- 提交/隔离当前 19 个改动，创建分支 `refactor/vue`（或 worktree）。
- 保存基线：路由清单、桌面/平板/手机截图、HTML 快照、Lighthouse、构建体积、RSS/sitemap 样例。
- **兼容性冒烟**：最小 Vite 8 + vite-ssg 28 + Vue 3.5 + Router 4.6 + base `/ZZZBlog/` + nested 输出 + PWA 构建成功；检查 Rolldown 产物（assets 命名/拆分、CSS minify、preload 路径、PWA 扫描文件）与 404.html 的脚本注入情况。
- 验收：冒烟工程产物目录/资源路径正确；失败则按降级矩阵调整版本。

### P1 骨架与静态页（1.5 天）——**已落地**（2026-11-21）

> 实施记录见附录 B：Vue 骨架已可在 `refactor-vue` worktree 构建，关于/个人主页/404 与 Astro 截图对齐；文章列表与详情已于 P2 接入内容层。


- 建 `index.html`、`vite.config.ts`、`src/main.ts`、`App.vue`、Router、DefaultLayout、Header/Footer/Background。
- 迁移 About / Profile / 404 / Redirect 的静态结构与样式。
- 接入 Tailwind + Less；确保 CSS 变量、图标 URL、主题变量生效。
- 验收：`pnpm dev` 在 `http://localhost:4321/ZZZBlog/` 正常；`pnpm build` 生成 nested HTML；`/ZZZBlog/about/`、`/profile/`、`/404.html` 视觉与基线一致；无 404 资源。

### P2 内容层与文章（2 天）——**已落地**（2026-11-21，见附录 B.7）

- schema 双写（Astro 侧保持 `astro:content` 的 z，Vue 侧独立 zod）；`build-content.ts`；`.content` 产物；dev watch。
- 列表页（卡片、瀑布流数据、封面尺寸）、详情页（正文、目录、meta）。
- Markdown 管线：GFM、Smartypants、KaTeX、Shiki、slug、图片尺寸/base。
- 搜索索引生成与消费。
- 验收：14 篇文章 URL 全部 200；标题锚点与旧版一致；公式/代码/表格/图片正确；列表排序一致；构建失败时错误信息可定位。

### P3 交互（1.5 天）——**已完成**（2026-11-21）

- 瀑布流、搜索、目录滚动高亮/移动浮层、图片预览、代码复制、返回键、页脚滑入。
- About 三级切换、Profile 双视图/复制/菜单/权益滚动。
- 验收：交互清单全过；无 hydration 警告；桌面/移动行为一致；**连续切换 `/article/1/ → 2 → 3`** 时目录/复制/预览均更新；移动端滚到底切桌面宽度后滚动复位。

### P4 外围能力（1 天）——**已完成**（2026-11-21）

- RSS、sitemap、robots、PWA、根跳转、404（静态化去脚本）、`.nojekyll`。
- 更新 GitHub Actions / Netlify / Vercel / `.pages.yml` 注释。
- 验收：feed XML 合法；sitemap 覆盖全部 URL；PWA 可安装、离线可读；子路径部署无 404。

### P5 对齐与切换（1 天）

- 全量视觉/功能回归、Lighthouse、跨浏览器、性能预算。
- 清理 Astro 依赖与配置；更新 README / 文档；合并。
- 保留 `astro-v2` 标签或分支至少一个发布周期。
- 验收：与基线截图差异可解释；构建/检查全绿；线上预览通过。

**总计约 7.5 人日**（不含视觉重设计）。

---

## 13. 验证方案

### 13.1 命令

```bash
pnpm install --frozen-lockfile
pnpm check        # vue-tsc --noEmit
pnpm lint
pnpm build        # content → vite-ssg → postbuild
pnpm preview      # 验证 /ZZZBlog/ 下的产物
```

### 13.2 路由矩阵

| URL | 期望 |
| --- | --- |
| `/ZZZBlog/` | 200；meta refresh 到 `/ZZZBlog/article/` |
| `/ZZZBlog/article/` | 200；14 张卡片；搜索可用 |
| `/ZZZBlog/article/1/` … `/14/` | 200；正文/目录/图片/代码正常 |
| `/ZZZBlog/about/`、`/profile/` | 200；交互正常 |
| `/ZZZBlog/404.html` | 200；404 内容；**不含 module script / modulepreload**（静态页，不启动 Vue） |
| `/ZZZBlog/rss.xml` | 200；XML 合法；14 条 |
| `/ZZZBlog/sitemap-index.xml`、`sitemap-0.xml` | 200；URL 完整 |
| `/ZZZBlog/robots.txt` | 200；Sitemap 地址正确 |
| 不存在的 `/ZZZBlog/foo/` | GitHub Pages 返回 404.html |

### 13.3 视觉与交互

- Playwright 截图：1440×900、768×1024、390×844，覆盖列表/详情/关于/个人主页；与基线人工比对。
- 交互脚本：搜索（标题/正文/键盘）、瀑布流高度、目录点击与滚动高亮、图片 modal、代码复制、返回键、页脚滑入、About 三级切换、Profile 双视图/复制/菜单。
- 设备切换：移动端滚到底 → 切桌面宽度，确认页面滚动复位（现有 `forceResetPageScroll` 逻辑）。
- 控制台：无 Vue hydration mismatch、无资源 404、无 SSR 阶段 window 报错。

### 13.4 SEO / PWA / 性能

- `curl` 检查 canonical / OG / JSON-LD / RSS link。
- Lighthouse：SEO、PWA、Accessibility 不低于基线；Performance 允许因框架运行时略降，但 LCP/CLS 不退化。
- 性能预算：首屏主包 JS gzip ≤ 90KB；单篇正文 chunk ≤ 80KB；搜索索引 chunk ≤ 30KB；CSS 体积与现状同量级（±10%）。
- 离线：安装 PWA → 断网 → 刷新已访问文章与列表页。
- 子路径扫描：`grep -R 'src="/img' dist`、`href="/article` 应为空（必须带 `/ZZZBlog`）；`grep -R '/ZZZBlog/ZZZBlog' dist` 必须为空。
- 构建期时间：`grep -R 'new Date()' src --include='*.vue' --include='*.ts'` 应为空（除注释/工具函数）；所有等级/天数/日期从 `__BUILD_TIME__` 派生。
- 正文分块：`dist/assets` 中每篇文章一个正文 chunk；主包不含 HTML 字符串；搜索索引独立 chunk。
- 404 静态化：`grep -c 'type="module"' dist/404.html` 为 0。

### 13.5 CI

- `pnpm check`、`pnpm lint`、`pnpm build` 全部通过才允许部署。
- 增加一个内容校验失败用例（临时坏 frontmatter）验证构建阻断。

---

## 14. 风险与对策

| # | 风险 | 影响 | 概率 | 对策 |
| --- | --- | --- | --- | --- |
| 1 | Vite 8 实为 Rolldown 构建，与 vite-ssg/PWA 的产物假设有差异 | 高 | 中 | P0 冒烟必须检查：`rollupOptions.input` 是否被接受、assets 命名/拆分、CSS minify、PWA 扫描到的文件、preload 路径；降级矩阵（Vite 7.3 + plugin-vue 6 + 对应 ssg） |
| 2 | base 处理不一致（RouterLink 双重 base、资源 404） | 高 | 高 | 单一 `siteConfig.base`；§5.2 规则表；构建后 grep 扫描；preview 全量点检 |
| 3 | 文章正文重复下载（SSG HTML + 首屏 chunk）或被打进主包 | 中 | 中 | 首屏从 DOM 捕获、不加载正文 chunk；二次导航才懒加载；包体预算；构建分析 |
| 4 | hydration mismatch（构建期时间、随机值、window 访问） | 中 | 高 | `__BUILD_TIME__` 固定时间；浏览器 API 全部放 `onMounted`；控制台零警告门槛 |
| 5 | SSG 路由枚举遗漏/尾斜杠错误 | 高 | 中 | `routes.json` 单一来源；`dirStyle: nested`；14 篇逐条 curl |
| 6 | GitHub Pages 的 404 与根跳转语义 | 中 | 中 | `404.html` 去脚本静态化 + meta refresh + canonical；catch-all 只在客户端渲染，不做 SPA 回退 |
| 7 | Markdown 渲染差异（slug/Shiki/Smartypants/KaTeX） | 中 | 高 | 新旧 HTML diff；`rehype-slug`；`data-language` 补齐；Smartypants 对齐 |
| 8 | zod 4 与 Astro zod 3 混用导致类型/JSON schema 失效 | 中 | 中 | 迁移期双写 schema，Astro 继续用 `astro:content` 的 z；Vue 侧单独 zod 4；P5 合并 |
| 9 | Tailwind purge 漏掉动态类 | 中 | 低 | 类名字面量；safelist；Markdown 走 Less |
| 10 | PWA 在 base/scope/缓存上出问题 | 中 | 中 | preview 子路径验证；SW 注册路径检查；离线测试 |
| 11 | RSS/sitemap 生成时序与 PWA 预缓存冲突 | 低 | 低 | postbuild 顺序固定；feed/sitemap 不预缓存（与现状一致） |
| 12 | 现有未提交改动被覆盖 | 高 | 中 | P0 先提交/建 worktree；不直接在主工作区改 |
| 13 | React 岛破坏 SEO 或包体 | 中 | 低 | 仅客户端挂载；内容型区块不用 React；包体检查 |
| 14 | 相对 Astro 的 JS 体积回退 | 中 | 高 | 明确预算；按路由拆分；移除未用依赖；必要时保留 Astro 作为性能优先分支 |
| 15 | PagesCMS 兼容性 | 中 | 低 | 路径/frontmatter 不变；迁移后试建/试改一篇 |
| 16 | 详情页同路由切 id 复用组件，交互停留在旧文章 | 高 | 高 | `RouterView :key="$route.path"`；composable 统一 cleanup；P3 增加“连续切换 1→2→3”用例 |

---

## 15. 回滚与切换

- 重构在 `refactor/vue` 分支完成，`master` 保持 Astro 可发布状态。
- 合并前打标签（如 `astro-v2-final`），保留完整回滚点。
- 切换后若线上出现阻断问题：直接 revert 合并提交/回滚部署，不需要数据迁移。
- 保留 Astro 依赖与页面直到 P5 验收通过再删除；删除时一并清理 `astro.config.mjs`、`src/pages`、`src/layouts`、`astro check` 脚本、`@astrojs/*` 依赖与 ESLint Astro 插件。

---

## 16. 待确认项

1. **React 首个真实用例**是什么？决定是否现在安装 React 依赖，还是只保留适配层与文档。
2. 是否接受首屏新增约 40–60KB gzip 的 Vue 运行时？若不能接受，应重新评估“保留 Astro + Vue 岛”的混合路线。
3. Node 基线是否统一到 24（本机与 CI）？
4. RSS 条目顺序保持现有 `id` 升序，还是改为按时间倒序？
5. 是否启用 `beasties` 关键 CSS（可能改变首屏样式注入方式，需额外回归）？
6. 是否保留 Netlify / Vercel 配置，还是只维护 GitHub Pages？
7. 视觉是否要求像素级一致（允许 1px 内差异），还是允许顺手优化？

---

## 附录 A：本轮已完成的准备（非重构代码）

- 代理：项目级 `.npmrc` 写入 `http://127.0.0.1:7897`，已用 `pnpm view` 与“死代理对照实验”验证 pnpm 实际走代理；`.npmrc` 已加入 `.gitignore`。
- 构建验证：`pnpm build` 成功（Astro 基线 18 页，PWA 57 项预缓存）。
- 开发服务器：`pnpm dev` 运行中，地址 `http://localhost:4321/ZZZBlog/`。
- 未改任何业务源码；工作区原有 19 个修改保持原样。

### A.1 技术冒烟结果（2026-11-21）

在 `/tmp/vue-ssg-smoke` 用最小工程验证了候选组合（Vue 3.5.46 / Router 4.6.5 / Vite 8.3.8 / vite-ssg 28.3.0 / plugin-vue 6.0.11 / TS 5.9.3）：

- 构建成功：client + server 两次 build，`dist/index.html`、`dist/article/1/index.html`、`dist/article/2/index.html`、`dist/article/index.html`、`dist/404.html` 均按 `nested` 输出。
- base 正确：HTML 中资源为 `/ZZZBlog/assets/...`，路由 base 为 `/ZZZBlog/`。
- 产物体积：最小应用主包 113.06 kB（gzip 43.22 kB），可作为 §13.4 预算的下界参考。
- **已确认问题**：`dist/404.html` 同样注入了入口 module script 与 modulepreload（vite-ssg 对每条路由复用 client `index.html`），因此 §5.3 的“404 去脚本”是必需项，不是可选项。
- **已验证修法**：加 `onPageRendered` 剥离 module script/modulepreload 后重新构建，`dist/404.html` 的 `type="module"` 计数为 0，`dist/index.html` 仍保留入口脚本，静态 404 方案可行。
- 已额外验证：在同一冒烟工程加 Tailwind 3.4.19 + PostCSS + Less 4.9.1，构建成功，`text-red-500` 与 `.less-check` 均出现在产物 CSS 中。
- 已额外验证：PWA（vite-plugin-pwa 2.0.0 + workbox 7.4.1）与 vite-ssg 28 协同正常——首次 build 生成 9 项预缓存，`vite-ssg` 渲染完 5 个路由后触发 `Regenerate PWA`，最终 13 项，`sw.js` 中包含 `article/1/index.html`、`article/2/index.html`、`404.html`，manifest 的 `start_url`/`scope` 均带 `/ZZZBlog/`。
- 已额外验证：真实 Markdown 管线（article 1）——标题 id 与 Astro 完全一致（`一级标题`、`二级标题`、`三级标题`、`三级标题-1`）；图片输出 `width="1440" height="2442"` 且 src 带 `/ZZZBlog`；KaTeX 正常输出；单篇正文 HTML 约 6.6KB。
- 实测发现两处必须补的差异：① Shiki 4 的 `<pre>` 没有 `data-language`；② 没有 Astro 的内联 `overflow-x: auto`。处理见 §7.1/§7.2。
- 实测坑：`rehype-image-attrs` 依赖 `process.cwd()` 找 `public/`，在非项目根运行时静默跳过尺寸（只补 base）。构建脚本需固定 cwd 或改插件签名。
- 未验证项：14 篇全量 SSG、PagesCMS 写入流程；留到 P0/P1 补齐。

## 附录 B：P1 实施记录（2026-11-21）

### B.1 分支与产物

- worktree：`/home/kingdove/ZZZBlog/.agents/worktrees/refactor-vue`，分支 `refactor-vue`（从 `9cc04c0` 创建，已把主工作区 19 个未提交改动与未跟踪资源带过去，主工作区未被改动）。
- Vue 应用目录：`app/`；共享配置/数据/样式仍在 `src/`。Astro 原页面保留，互不扫描。
- 已新增：`index.html`、`vite.config.ts`、`tsconfig.vue.json`、`app/{main.ts,App.vue,env.d.ts,router,layouts,pages,components,constants}`、`src/styles/index.less`。
- 页面：`ArticleListPage` / `ArticleDetailPage`（P2 占位）、`AboutPage`、`ProfilePage`、`NotFoundPage`、`RedirectPage`。
- 组件：`AppBackground`、`AppHeader`、`AppFooter`、`AppAuthor`、`SearchBox`、`AboutBook`。

### B.2 构建与体积

- `pnpm build:vue` 成功：5 条静态路由（`/`、`/article/`、`/about/`、`/profile/`、`/404/`），`dirStyle: nested`，`404.html` 无 module script。
- 客户端主包 `app-*.js`：140.38 KB（gzip **52.72 KB**）；样式 `app-*.css`：54.82 KB（gzip 12.18 KB）。
- 页面：about 22.68 KiB、profile 10.44 KiB、article list 7.30 KiB、404 7.38 KiB。
- `pnpm check:vue` 通过（vue-tsc 3.3.14 / TS 5.9.3）。

### B.3 视觉对齐（Chromium 1440×900 / 390×844 截图）

- `/about/`、`/profile/`、`/404.html` 与 Astro 基线截图逐页比对：布局、配色、字体、头像/勋章、书册结构、页脚位置一致；移动端关于页一致。
- 发现并修正：AboutBook 的栏目页签在 Astro 首屏会被 `about-book.ts` 的 `sync()` 取消 `hidden`（显示当前组全部栏目），Vue 静态版需用 `hidden: gi !== 0` 才能对齐；仅按初始 class 写会少一个“构建与部署”。
- 修正 `<html lang>` 被 unhead 默认成 `en` 的问题：在 `App.vue` 用 `useHead({ htmlAttrs: { lang: siteConfig.lang } })`。
- 修正 `aria-expanded` 的 TS 类型（用 boolean，不用 `String()`）。

### B.4 新增的构建期约束

- `__BUILD_TIME__`：ISO 字符串，client/server 两次 build 共用。
- `__BUILD_DATE_LABEL__`：按 `Asia/Shanghai` 预格式化为 `11月21日`，避免访客时区不同导致个人主页签名日期 hydration 不一致。
- `vite.config.ts` 对 `src/config/site.ts` 使用显式 `.ts` 扩展名，消除 Vite native config loader 警告。

### B.5 已知未完成 / 风险

- 文章列表与详情仍是 P2 占位；搜索、瀑布流、目录、图片预览、代码复制、Profile/About 交互仍为 P3。
- RSS、sitemap、robots、PWA、根跳转的 postbuild 仍为 P4；当前 Vue 构建未接 `vite-plugin-pwa`。
- **Astro 回退构建已实测**：worktree 中 `pnpm build`（Astro）成功，18 页 + PWA 57 项预缓存。虽然 `@vite-pwa/astro@1.2.0` 对 `vite-plugin-pwa@2.0.0` 报 peer warning，但运行正常；这是“两套构建共存”的可行证据。
- 迁移期 ESLint 尚未接 `eslint-plugin-vue`；P5 统一。

### B.6 常用命令（worktree 内）

```bash
pnpm dev:vue       # http://localhost:4322/ZZZBlog/
pnpm build:vue     # content 尚未接入，输出 5 条路由
pnpm preview:vue   # 预览 dist
pnpm check:vue     # vue-tsc
```

### B.7 P2 增量（同日）

- 内容管线：`scripts/build-content.ts` + `src/content/schema.ts`（zod 4），生成 `.content/`（index 112KB、14 篇正文 JSON、search-index、routes）。
- Markdown 管线：GFM + Smartypants + KaTeX + Shiki（github-dark）+ `rehype-slug` + 复用 `rehype-image-attrs`；标题 id 与 Astro 一致；图片 width/height/base 正确。
- 两个实测修正：
  1. Shiki 4 默认不输出 `data-language`，且 `rehype` 阶段改写不可靠；最终用 `addLanguageClass: true` + 构建期字符串替换补 `data-language`。
  2. Shiki 4 不再输出内联 `overflow-x`，已在 `markdown.less` 的 `pre` 补上。
- 路由：19 条 SSG 路由（`/`、`/article/`、14 篇、`/about/`、`/profile/`、`/404/`）；页面路由改为懒加载，KaTeX CSS 被拆到 `ArticleDetailPage-*.css`（28.86KB），不再拖累列表页。
- 首屏正文：直接从 `[data-article-body]` 捕获；实测首屏**不请求**正文 chunk，客户端二次导航只请求目标文章 chunk（如 `2-*.js`）。
- 详情页：`RouterView :key="$route.path"`；1→2 切换后标题、正文、TOC 全部更新。
- 产物：主包 `app-*.js` 124.38KB（gzip **47.16KB**）；主 CSS 54.98KB（gzip 12.21KB）；页面 19 个。
-  hydration：`/article/`、`/article/1/`、`/about/`、`/profile/` 控制台无 mismatch。修正了两类空白节点差异：
  - 导航 `{{ nav.title }}` 与相邻 `<div>` 之间的换行空格；
  - AboutBook 的页签/卡片标题/“前往”按钮文本节点。
- **P3 已补**：文章详情/个人主页返回按钮（`useBackButton`，按压闪烁 0.3s 后 `history.back()`）；已用 Playwright 验证「列表 → 文章 → 返回列表」。
- **P3 全部完成**：搜索、TOC 滚动高亮/移动浮层、图片放大、代码复制、页脚滑入、Profile/About 交互。
- **P4 全部完成**：RSS、sitemap、robots、PWA、静态 404、根跳转。
- 回归结果见附录 B.8。
- 常用命令新增：`pnpm content`；默认 `pnpm dev` / `pnpm build` 已切换为 Vue（自动先跑内容生成）。
- **Astro 原版已删除并已合并到主工作区**：`refactor-vue` 分支提交 `fd9c25c`，主分支 fast-forward 到该提交；主工作区现在是 Vue 版本。原 Astro 工作区改动已 stash 备份（`backup: Astro working tree before Vue merge`）。

### B.8 P3/P4 全量回归（2026-11-21）

**测试方式**：Playwright（Chromium）驱动真实构建产物，覆盖桌面 1440×900 与移动 390×844；同时检查控制台错误、clipboard、PWA 离线与所有静态产物。

| 区域 | 用例 | 结果 |
| --- | --- | --- |
| 返回按钮 | 列表 → 文章 → 返回 | 回到列表，卡片 14 张 |
| 列表 | 第 3 张卡片进入文章 3 | 通过 |
| Header | 头像 → 个人主页；文章/关于导航；移动端汉堡菜单 | 全部通过 |
| 搜索 | 桌面/移动搜索栏/移动菜单搜索；标题+正文匹配；方向键+Enter；Esc；无结果 | 全部通过 |
| 文章 | 目录点击滚动、滚动高亮、移动端目录浮层 | 通过（滚动 190px，active link=1） |
| 文章 | 图片放大/关闭、代码复制、页脚滑入 | 全部通过 |
| 关于 | 关于我/友链、栏目切换、卡片点选、键盘左右、友链“前往”弹窗 | 全部通过（弹窗 https://interk.net/） |
| 个人主页 | 个人主页/绳匠档案、UID 复制、更多菜单、分享复制、权益滚动、绳匠等级入口 | 全部通过 |
| 404 | 返回文章列表 | 通过 |
| 根跳转 | `/` → `/article/` | 通过 |
| 订阅 | `/rss.xml`（14 条）、sitemap-index/0、robots | 200，URL 全部带 base |
| PWA | SW scope `/ZZZBlog/`、离线刷新文章 | 通过（离线可读） |
| 剪贴板 | 局域网 http（Clipboard API 不可用）下 UID/分享/代码复制 | 回退 execCommand，按钮显示“已复制” |
| 控制台 | 全流程 error/warning | 0 |

**回归中发现并修复的真实 bug**：

1. **TOC 滚动高亮完全失效**：`IntersectionObserver` 的 `rootMargin: '-1rem 0px -70% 0px'` 在 Chrome 抛 `SyntaxError`（rootMargin 只接受 px/%）。改为 `-16px 0px -70% 0px`，并在点击目录时立即 `setActive`。
2. **移动端搜索下拉跑到页面底部**：`.search-box-bar` / `.search-box-menu` 没有定位上下文，`.search-results` 相对 `.page-shell` 定位，结果落到页脚附近并被页脚拦截点击。给两个变体补 `position: relative`。
3. **返回按钮未绑定**：补 `useBackButton`，详情页与个人主页共用。
4. **PWA 在 SSG 之后注入 registerSW，导致静态 404 仍带脚本**：postbuild 对 `404.html` 统一剥离所有 `<script>` 与 modulepreload。
5. **局域网 http 下 Clipboard API 不可用**：新增 `copyText()`，在非安全上下文回退 `execCommand('copy')`。

**当前产物**：19 条 SSG 路由；主包 gzip 47.16KB；KaTeX CSS 已按路由拆分；RSS/sitemap/robots/PWA 全部生成。主工作区已切换到 Vue（提交 `fd9c25c`）。

**仍属 P5**：README 完整重写、最终视觉/性能回归、CI 调整、清理 worktree 与 stash。

## 附录 C：关键文件索引

- 配置：`vite.config.ts`、`tsconfig.json`、`src/config/site.ts`、`src/content/schema.ts`、`tailwind.config.ts`
- 页面：`src/pages/article/index.astro`、`src/pages/article/[id].astro`、`src/pages/about.astro`、`src/pages/profile.astro`
- 组件：`src/components/`
- 交互：`src/scripts/`
- 样式：`src/styles/`
- 部署：`.github/workflows/deploy.yml`、`netlify.toml`、`vercel.json`、`.pages.yml`
