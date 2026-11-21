import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { authorInfo, siteConfig, withBase } from './src/config/site.ts'

const contentRoutes: string[] = (() => {
  try {
    return JSON.parse(readFileSync(new URL('./.content/routes.json', import.meta.url), 'utf8'))
  } catch {
    return ['/', '/article/', '/about/', '/profile/', '/404/']
  }
})()

const stripScripts = (html: string) =>
  html
    .replace(/<script\b[^>]*type="module"[^>]*>\s*<\/script>/g, '')
    .replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')

export default defineConfig({
  base: withBase('/'),
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./app', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    // 固定时区下的日期标签，避免客户端时区不同导致 hydration 不一致
    __BUILD_DATE_LABEL__: JSON.stringify(
      new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric' }).format(new Date()).replace('/', '月') + '日',
    ),
  },
  server: { host: true, port: 4322 },
  preview: { host: true },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: siteConfig.blogName,
        short_name: authorInfo.name,
        description: siteConfig.description,
        lang: siteConfig.lang,
        start_url: withBase('/article/'),
        scope: withBase('/'),
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: withBase('/pwa-192.png'), sizes: '192x192', type: 'image/png' },
          { src: withBase('/pwa-512.png'), sizes: '512x512', type: 'image/png' },
          { src: withBase('/pwa-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,ico,svg,woff2}'],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages', networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ],
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'minify',
    includedRoutes: () => contentRoutes,
    htmlFileName: (file) => (file === '404/index.html' ? '404.html' : undefined),
    onPageRendered: (route, html) => (route === '/404/' ? stripScripts(html) : html),
  },
})