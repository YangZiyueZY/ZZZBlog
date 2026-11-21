<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import 'katex/dist/katex.min.css'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { articleIndex, getArticleIndex, getCachedArticleHtml, loadArticleHtml, prerenderedArticle } from '../lib/content'
import { authorInfo, siteConfig, withBase } from '../../src/config/site'
import { copyText } from '../lib/clipboard'
import { useArticleDetail } from '../composables/useArticleDetail'
import { useArticleToc } from '../composables/useArticleToc'
import { useArticleProgress } from '../composables/useArticleProgress'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const article = computed(() => getArticleIndex(id))
const meta = computed(() => article.value?.meta)
const headings = computed(() => (article.value?.headings ?? []).filter((item) => item.depth >= 2 && item.depth <= 3))
const readingTime = computed(() => article.value?.readingTime ?? 1)
const wordCount = computed(() => article.value?.wordCount ?? 0)
const category = computed(() => meta.value?.categories[0] ?? '随笔')
const cover = computed(() => meta.value?.cover[0] ?? '')

const html = ref(getCachedArticleHtml(id) ?? (prerenderedArticle.id === id ? prerenderedArticle.html : ''))
const detailRoot = ref<HTMLElement>()
const shared = ref(false)
useArticleDetail(detailRoot)
useArticleToc(detailRoot)
const { progress } = useArticleProgress()

const formatDate = (value: string) => value.slice(0, 10).replaceAll('-', '.')
const days = Math.ceil((new Date(__BUILD_TIME__).getTime() - new Date(authorInfo.birth).getTime()) / 86400000)
const level = Math.floor(days / 365)

const index = computed(() => articleIndex.findIndex((item) => item.meta.id === id))
const previous = computed(() => (index.value > 0 ? articleIndex[index.value - 1] : null))
const next = computed(() => (index.value >= 0 && index.value < articleIndex.length - 1 ? articleIndex[index.value + 1] : null))

const goBack = () => router.back()
const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const share = async () => {
  const ok = await copyText(window.location.href)
  shared.value = ok
  window.setTimeout(() => {
    shared.value = false
  }, 1600)
}

onMounted(async () => {
  if (!html.value) {
    try {
      html.value = await loadArticleHtml(id)
    } catch {
      html.value = ''
    }
  }
})
</script>

<template>
  <DefaultLayout
    v-if="meta"
    hide-mobile-search
    is-article
    :title="`${meta.title} - ${siteConfig.blogName}`"
    :description="meta.description || siteConfig.description"
    :og-image="meta.cover[0]"
    :published-time="meta.createTime"
    :updated-time="meta.modifiedTime"
  >
    <div ref="detailRoot" class="article-page">
      <div class="article-progress" aria-hidden="true">
        <span :style="{ width: `${progress}%` }"></span>
      </div>

      <div class="article-wrap">
        <div class="article-topbar">
          <button class="article-back" type="button" @click="goBack"><span aria-hidden="true">←</span> 返回</button>
          <nav class="article-breadcrumb" aria-label="面包屑">
            <RouterLink to="/article/">文章</RouterLink>
            <span aria-hidden="true">/</span>
            <span>{{ category }}</span>
          </nav>
          <button class="article-share" type="button" @click="share">{{ shared ? '已复制' : '复制链接' }}</button>
        </div>

        <header class="article-hero" :class="{ 'article-hero--no-cover': !cover }">
          <div class="article-hero-copy">
            <span class="article-kicker"><span aria-hidden="true">//</span> {{ category }}</span>
            <h1>{{ meta.title }}</h1>
            <p v-if="meta.description" class="article-lead">{{ meta.description }}</p>
            <div v-if="meta.tags.length" class="article-tags">
              <span v-for="tag in meta.tags" :key="tag">{{ tag }}</span>
            </div>
            <div class="article-hero-meta">
              <RouterLink to="/profile/" class="article-author">
                <img :src="withBase(authorInfo.avatar)" :alt="`${authorInfo.name}的头像`" loading="eager" decoding="async" />
                <span><strong>{{ authorInfo.name }}</strong><small>LV.{{ level }} · 站长</small></span>
              </RouterLink>
              <span class="article-meta-sep" aria-hidden="true"></span>
              <span>{{ formatDate(meta.createTime) }}</span>
              <span v-if="meta.modifiedTime !== meta.createTime">更新 {{ formatDate(meta.modifiedTime) }}</span>
              <span class="article-meta-sep" aria-hidden="true"></span>
              <span>{{ readingTime }} 分钟</span>
              <span>{{ wordCount }} 字</span>
              <span>{{ meta.views }} 浏览</span>
            </div>
          </div>
          <figure v-if="cover" class="article-hero-cover">
            <img :src="withBase(cover)" :alt="meta.title" loading="eager" decoding="async" />
          </figure>
        </header>

        <div class="article-body-layout">
          <article class="article-content">
            <div class="markdown-body" data-article-body :data-article-id="id" v-html="html"></div>

            <footer class="article-end">
              <span class="article-end-mark" aria-hidden="true">// END</span>
              <p>感谢阅读，希望这篇记录对你有帮助。</p>
              <div class="article-end-actions">
                <button type="button" @click="share">{{ shared ? '已复制链接' : '复制链接' }}</button>
                <button type="button" @click="scrollTop">回到顶部</button>
              </div>
            </footer>
          </article>

          <aside class="article-rail" :class="{ 'article-rail--no-toc': !headings.length }" aria-label="文章辅助信息">
            <div v-if="headings.length" class="article-toc" data-role="article-toc" aria-label="文章目录">
              <div class="article-rail-head"><span>目录</span><span>{{ Math.round(progress) }}%</span></div>
              <nav>
                <a
                  v-for="item in headings"
                  :key="item.slug"
                  class="article-toc__link"
                  :class="{ 'article-toc__link--sub': item.depth === 3 }"
                  :href="`#${item.slug}`"
                >{{ item.text }}</a>
              </nav>
            </div>

            <div class="article-author-card">
              <span class="article-rail-en">AUTHOR</span>
              <RouterLink to="/profile/" class="article-author-card-main">
                <img :src="withBase(authorInfo.avatar)" :alt="`${authorInfo.name}的头像`" loading="lazy" decoding="async" />
                <span><strong>{{ authorInfo.name }}</strong><small>LV.{{ level }} · 站长</small></span>
              </RouterLink>
              <p>记录技术、游戏与日常的绳网档案。</p>
              <RouterLink to="/profile/" class="article-author-card-link">查看主页 ↗</RouterLink>
            </div>

            <div class="article-rail-actions">
              <button type="button" @click="share">{{ shared ? '已复制' : '复制当前链接' }}</button>
              <button type="button" @click="scrollTop">回到顶部</button>
            </div>
          </aside>
        </div>

        <nav class="article-pager" aria-label="文章翻页">
          <RouterLink v-if="previous" :to="`/article/${previous.meta.id}/`" class="article-pager-link"><span>上一篇</span><strong>{{ previous.meta.title }}</strong></RouterLink>
          <span v-else class="article-pager-empty"></span>
          <RouterLink v-if="next" :to="`/article/${next.meta.id}/`" class="article-pager-link article-pager-link--next"><span>下一篇</span><strong>{{ next.meta.title }}</strong></RouterLink>
        </nav>
      </div>

      <button v-if="headings.length" class="toc-fab" type="button" aria-label="打开文章目录" aria-expanded="false" aria-controls="article-toc">目录 <span>{{ Math.round(progress) }}%</span></button>

      <div class="image-modal" id="image-modal" aria-hidden="true" role="dialog" aria-label="图片预览">
        <button class="close-button" type="button" aria-label="关闭图片预览"></button>
        <div class="close-button_pressed"></div>
        <img id="modal-image" class="modal-img mx-auto mt-[var(--height-header)] mb-[var(--height-footer)] w-[80%] bg-contain border-8 border-black rounded-[0_var(--border-image-modal)_0_var(--border-image-modal)] z-[53]" src="" alt="" />
      </div>
    </div>
  </DefaultLayout>
</template>