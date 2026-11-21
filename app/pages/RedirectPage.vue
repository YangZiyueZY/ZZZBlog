<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { siteConfig, withBase } from '../../src/config/site'

const target = withBase('/article/')
const router = useRouter()

useHead({
  title: `Redirecting to: ${target}`,
  meta: [
    { 'http-equiv': 'refresh', content: `0;url=${target}` },
    { name: 'robots', content: 'noindex' },
  ],
  link: [{ rel: 'canonical', href: `${siteConfig.site}${target}` }],
})

onMounted(() => {
  router.replace('/article/')
})
</script>

<template>
  <div>
    <p>Redirecting to <a :href="target">{{ target }}</a></p>
  </div>
</template>
