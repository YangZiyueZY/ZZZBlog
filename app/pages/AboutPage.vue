<script setup lang="ts">
import DefaultLayout from '../layouts/DefaultLayout.vue'
import AboutBook from '../components/AboutBook.vue'
import { siteConfig } from '../../src/config/site'
</script>

<template>
  <DefaultLayout :title="`关于 - ${siteConfig.blogName}`" :description="siteConfig.description">
    <!-- 桌面端留出书册右缘「书页位」（book_page 右伸 2rem）所需的水平边距 -->
    <div class="mx-auto w-full max-w-[80rem] md:px-10">
      <AboutBook />
    </div>
  </DefaultLayout>
</template>
