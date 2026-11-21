<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { siteConfig } from '../src/config/site'

useHead({
  htmlAttrs: { lang: siteConfig.lang },
})
</script>

<template>
  <RouterView :key="$route.path" />
</template>