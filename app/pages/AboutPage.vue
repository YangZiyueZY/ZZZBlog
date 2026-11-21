<script setup lang="ts">
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { aboutInfo } from '../../src/data/about'
import { authorInfo, siteConfig, withBase } from '../../src/config/site'

const friendGroup = aboutInfo.find((group) => group.title === '友链')
const friends = friendGroup?.item.flatMap((column) => column.item) ?? []

interface SiteLink {
  title: string
  description: string
  href: string
  mono: string
  icon?: string
}

const tools = [
  {
    title: '搞机工具箱 · WebADB',
    description: '全安卓通用、免 ROOT 的网页版玩机工具箱，基于 WebADB 在浏览器中连接安卓设备。',
    href: 'https://czjam.github.io/gjgjxweb/',
    icon: '/img/tools/gjgjx.ico',
    mono: 'ADB',
  },
  {
    title: 'Fingerpoint Detector',
    description: '让模型随手写几百个整数，识别 API 背后的大语言模型。',
    href: 'https://lm.ikale.io/',
    icon: '/img/tools/fingerpoint.webp',
    mono: 'FP',
  },
]

const siteLinks: SiteLink[] = [
  {
    title: 'RSS 订阅',
    description: '用阅读器订阅本站，文章更新自动送达。',
    href: withBase('/rss.xml'),
    mono: 'RSS',
  },
  {
    title: 'GitHub',
    description: '本站源码与后续更新都在这里。',
    href: 'https://github.com/YangZiyueZY/ZZZBlog',
    icon: '/img/icons/github.svg',
    mono: 'GH',
  },
  {
    title: '邮件联系',
    description: authorInfo.email,
    href: `mailto:${authorInfo.email}`,
    mono: '@',
  },
]
</script>

<template>
  <DefaultLayout :title="`更多 - ${siteConfig.blogName}`" :description="`${siteConfig.blogName} 的友链与更多入口`">
    <div class="more-page">
      <header class="more-hero">
        <span class="more-hero-en" aria-hidden="true">MORE</span>
        <h1>更多</h1>
        <p>友链、订阅与联系入口。想交换友链，欢迎邮件联系。</p>
      </header>

      <section class="more-section" aria-labelledby="more-friends">
        <h2 id="more-friends"><span class="more-section-mark" aria-hidden="true">//</span> 友链</h2>
        <div class="more-grid">
          <a
            v-for="friend in friends"
            :key="friend.title"
            class="more-card"
            :href="friend.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="more-card-icon">
              <img :src="withBase(friend.icon ?? friend.url)" :alt="friend.title" loading="lazy" decoding="async" />
            </span>
            <span class="more-card-body">
              <strong>{{ friend.title }}</strong>
              <span>{{ friend.description }}</span>
            </span>
            <span class="more-card-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section class="more-section" aria-labelledby="more-tools">
        <h2 id="more-tools"><span class="more-section-mark" aria-hidden="true">//</span> 工具</h2>
        <div class="more-grid">
          <a
            v-for="tool in tools"
            :key="tool.title"
            class="more-card"
            :href="tool.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="more-card-icon" :class="tool.icon ? 'more-card-icon--tool' : 'more-card-icon--mono'">
              <img v-if="tool.icon" :src="withBase(tool.icon)" :alt="tool.title" loading="lazy" decoding="async" />
              <template v-else>{{ tool.mono }}</template>
            </span>
            <span class="more-card-body">
              <strong>{{ tool.title }}</strong>
              <span>{{ tool.description }}</span>
            </span>
            <span class="more-card-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section class="more-section" aria-labelledby="more-links">
        <h2 id="more-links"><span class="more-section-mark" aria-hidden="true">//</span> 站点入口</h2>
        <div class="more-grid">
          <a
            v-for="link in siteLinks"
            :key="link.title"
            class="more-card"
            :href="link.href"
            :target="link.href.startsWith('http') ? '_blank' : undefined"
            :rel="link.href.startsWith('http') ? 'noopener noreferrer' : undefined"
          >
            <span class="more-card-icon" :class="link.icon ? 'more-card-icon--tool' : 'more-card-icon--mono'">
              <img v-if="link.icon" :src="withBase(link.icon)" :alt="link.title" loading="lazy" decoding="async" />
              <template v-else>{{ link.mono }}</template>
            </span>
            <span class="more-card-body">
              <strong>{{ link.title }}</strong>
              <span>{{ link.description }}</span>
            </span>
            <span class="more-card-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </div>
  </DefaultLayout>
</template>