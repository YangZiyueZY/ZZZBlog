<script setup lang="ts">
import { ref } from 'vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import ArticleCard from '../components/ArticleCard.vue'
import { articleIndex } from '../lib/content'
import { useMasonry } from '../composables/useMasonry'
import { siteConfig } from '../../src/config/site'

const gridRef = ref<HTMLElement>()
useMasonry(gridRef)
</script>

<template>
  <DefaultLayout :title="`文章 - ${siteConfig.blogName}`" :description="siteConfig.description">
    <div class="relative my-8 mx-auto max-w-[90%] min-h-[100vh]">
      <div
        ref="gridRef"
        class="article-grid grid items-start gap-5 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2"
        data-masonry
      >
        <ArticleCard v-for="(article, idx) in articleIndex" :key="article.meta.id" :article="article" :index="idx" />
      </div>
    </div>
  </DefaultLayout>
</template>
