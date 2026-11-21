<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import 'katex/dist/katex.min.css'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { getArticleIndex, getCachedArticleHtml, loadArticleHtml, prerenderedArticle } from '../lib/content'
import { siteConfig } from '../../src/config/site'
import { useBackButton } from '../composables/useBackButton'
import { useArticleDetail } from '../composables/useArticleDetail'
import { useArticleToc } from '../composables/useArticleToc'

const route = useRoute()
const id = Number(route.params.id)
const article = computed(() => getArticleIndex(id))
const meta = computed(() => article.value?.meta)
const headings = computed(() => (article.value?.headings ?? []).filter((item) => item.depth >= 2 && item.depth <= 3))

const html = ref(getCachedArticleHtml(id) ?? (prerenderedArticle.id === id ? prerenderedArticle.html : ''))
const backPressed = ref<HTMLElement>()
const { onBack } = useBackButton(backPressed)
const detailRoot = ref<HTMLElement>()
useArticleDetail(detailRoot)
useArticleToc(detailRoot)

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
    fit-viewport
    hide-mobile-search
    is-article
    :title="`${meta.title} - ${siteConfig.blogName}`"
    :description="meta.description || siteConfig.description"
    :og-image="meta.cover[0]"
    :published-time="meta.createTime"
    :updated-time="meta.modifiedTime"
  >
    <div ref="detailRoot" class="relative min-h-[100vh] md:min-h-[0] pt-2 md:pt-[var(--height-header)]">
      <button class="back-button" type="button" aria-label="返回上一页" @click="onBack"></button>
      <div ref="backPressed" class="back-button_pressed"></div>

      <div class="article-layout md:mx-auto md:flex md:max-w-[76rem] md:items-start md:gap-x-6 md:px-8">
        <article
          data-role="article-scroll"
          class="md:flex-1 md:min-w-0 md:self-stretch md:overflow-y-auto md:p-5 md:pb-[calc(var(--height-footer)+1.25rem)] sm:m-0 sm:p-2 text-xl text-white bg-[#1e1e1e] md:rounded-2xl sm:rounded-none border-4 border-black"
        >
          <div class="markdown-body" data-article-body :data-article-id="id" v-html="html"></div>
        </article>

        <aside v-if="headings.length" id="article-toc" class="article-toc hidden md:block shrink-0" data-role="article-toc" aria-label="文章目录">
          <span class="article-toc__label">目录</span>
          <nav>
            <a
              v-for="item in headings"
              :key="item.slug"
              class="article-toc__link"
              :class="{ 'article-toc__link--sub': item.depth === 3 }"
              :href="`#${item.slug}`"
            >{{ item.text }}</a>
          </nav>
        </aside>
      </div>

      <button v-if="headings.length" class="toc-fab md:hidden" type="button" aria-label="打开文章目录" aria-expanded="false" aria-controls="article-toc">目录</button>

      <div class="image-modal" id="image-modal" aria-hidden="true" role="dialog" aria-label="图片预览">
        <button class="close-button" type="button" aria-label="关闭图片预览"></button>
        <div class="close-button_pressed"></div>
        <img id="modal-image" class="modal-img mx-auto mt-[var(--height-header)] mb-[var(--height-footer)] w-[80%] bg-contain border-8 border-black rounded-[0_var(--border-image-modal)_0_var(--border-image-modal)] z-[53]" src="" alt="" />
      </div>
    </div>
  </DefaultLayout>
</template>