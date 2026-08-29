// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeImageAttrs from './src/lib/rehype-image-attrs.mjs';
import { VitePWA } from 'vite-plugin-pwa';
import { siteConfig } from './src/config/site.ts';

// https://astro.build/config
export default defineConfig({
  // 站点域名（sitemap / RSS / canonical 依赖，集中配置在 src/config/site.ts）
  site: siteConfig.site,
  // 统一带尾斜杠的 URL 契约（/article/1/）
  trailingSlash: 'always',
  // 旧入口保持可用：/ → /article/
  redirects: {
    '/': '/article/',
  },
  integrations: [sitemap()],
  markdown: {
    // 代码高亮在构建期完成（Shiki），不随客户端下发任何高亮 JS
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeImageAttrs],
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: siteConfig.blogName,
          short_name: authorShortName(),
          description: siteConfig.description,
          lang: siteConfig.lang,
          start_url: '/article/',
          scope: '/',
          display: 'standalone',
          background_color: '#000000',
          theme_color: '#000000',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // 静态站：预缓存构建产物 + 运行时缓存访问过的页面（NetworkFirst），支持离线阅读
          globPatterns: ['**/*.{js,css,html,webp,png,ico,svg,woff2}'],
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 3,
              },
            },
          ],
        },
      }),
    ],
  },
});

/** 应用名过长时取站点名首词，避免安装后标题被截断 */
function authorShortName() {
  return siteConfig.author.name;
}
