<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import AppBackground from '../components/AppBackground.vue'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import SearchBox from '../components/SearchBox.vue'
import { siteConfig, authorInfo, stripBase, withBase } from '../../src/config/site'

const props = defineProps<{
  title?: string
  description?: string
  fitViewport?: boolean
  hideHeader?: boolean
  hideMobileSearch?: boolean
  isArticle?: boolean
  ogImage?: string
  publishedTime?: string
  updatedTime?: string
}>()

const route = useRoute()
const title = computed(() => props.title ?? siteConfig.blogName)
const description = computed(() => props.description ?? siteConfig.description)
const isArticlePage = computed(() => stripBase(route.path).startsWith('/article'))
const canonical = computed(() => `${siteConfig.site}${withBase(route.path)}`)
const ogImageUrl = computed(() => (props.ogImage ? `${siteConfig.site}${withBase(props.ogImage)}` : undefined))

const iconVars = computed(() => ({
  '--icon-back': `url('${withBase('/icon/back.webp')}')`,
  '--icon-back-pressed': `url('${withBase('/icon/back_pressed.webp')}')`,
  '--icon-close': `url('${withBase('/icon/close.webp')}')`,
  '--icon-close-pressed': `url('${withBase('/icon/close_pressed.webp')}')`,
  '--icon-zzz-loading': `url('${withBase('/icon/zzz-loading.webp')}')`,
  '--icon-quote': `url('${withBase('/icon/quote.webp')}')`,
}))

const ldJson = computed(() => {
  if (props.isArticle) {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: title.value,
          description: description.value,
          image: ogImageUrl.value,
          datePublished: props.publishedTime,
          dateModified: props.updatedTime,
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonical.value },
          author: { '@type': 'Person', name: authorInfo.name, url: `${siteConfig.site}${withBase('/profile/')}` },
        },
        { '@type': 'WebSite', name: siteConfig.blogName, url: siteConfig.site },
      ],
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.blogName,
    url: siteConfig.site,
    description: description.value,
  }
})

useHead({
  htmlAttrs: { lang: siteConfig.lang, class: props.isArticle ? 'article-view' : undefined },
  bodyAttrs: { class: props.isArticle ? 'article-view' : undefined },
  title: title.value,
  meta: [
    { name: 'description', content: description.value },
    { name: 'keywords', content: siteConfig.blogName },
    { property: 'og:site_name', content: siteConfig.blogName },
    { property: 'og:title', content: title.value },
    { property: 'og:description', content: description.value },
    { property: 'og:url', content: canonical.value },
    { property: 'og:type', content: props.isArticle ? 'article' : 'website' },
    ...(ogImageUrl.value ? [{ property: 'og:image', content: ogImageUrl.value }] : []),
    ...(props.isArticle && props.publishedTime ? [{ property: 'article:published_time', content: props.publishedTime }] : []),
    ...(props.isArticle && props.updatedTime ? [{ property: 'article:modified_time', content: props.updatedTime }] : []),
    { name: 'twitter:card', content: ogImageUrl.value ? 'summary_large_image' : 'summary' },
  ],
  link: [
    { rel: 'canonical', href: canonical.value },
    { rel: 'icon', type: 'image/x-icon', href: withBase('/favicon.ico') },
    { rel: 'apple-touch-icon', href: withBase('/apple-touch-icon.png') },
    { rel: 'alternate', type: 'application/rss+xml', title: title.value, href: withBase('/rss.xml') },
  ],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(ldJson.value).replace(/</g, '\\u003c') }],
})
</script>

<template>
  <div :style="iconVars">
    <AppBackground />
    <AppHeader v-if="!hideHeader" />
    <div
      class="page-shell relative w-full min-h-[100vh] overflow-hidden"
      :class="[
        { 'mt-[var(--height-header)]': !hideHeader },
        { 'md:h-[calc(100dvh-var(--height-header))] md:min-h-[0]': fitViewport },
      ]"
    >
      <SearchBox v-if="isArticlePage && !hideMobileSearch" variant="bar" />
      <slot />
    </div>
    <AppFooter :class="fitViewport ? 'footer-auto-reveal' : undefined" />
  </div>
</template>