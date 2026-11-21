<script setup lang="ts">
import { ref } from 'vue'
import { useSearch } from '../composables/useSearch'

withDefaults(defineProps<{ variant?: 'inline' | 'bar' | 'menu' }>(), { variant: 'inline' })

const root = ref<HTMLElement>()
const {
  query,
  openResults,
  hits,
  selected,
  loaded,
  resultsEl,
  onInput,
  onFocus,
  onKeydown,
  go,
  highlight,
  withBase,
} = useSearch(root)
</script>

<template>
  <div
    ref="root"
    class="search-box"
    :class="variant === 'inline' ? 'search-box-inline absolute left-1/2 -translate-x-1/2 hidden md:block' : variant === 'menu' ? 'search-box-menu' : 'search-box-bar md:hidden'"
  >
    <div class="search-field">
      <input
        v-model="query"
        class="search-input"
        type="search"
        placeholder="搜索文章标题或内容…"
        autocomplete="off"
        aria-label="搜索文章"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeydown"
      />
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.5"></circle>
        <path d="M16.5 16.5 L21 21" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"></path>
      </svg>
    </div>
    <div v-if="openResults" ref="resultsEl" class="search-results open">
      <div v-if="!loaded" class="search-empty">搜索中…</div>
      <div v-else-if="hits.length === 0" class="search-empty">未找到相关文章</div>
      <template v-else>
        <a
          v-for="(doc, index) in hits"
          :key="doc.id"
          class="search-result"
          :class="{ selected: index === selected }"
          :href="withBase(doc.url)"
          @click.prevent="go(doc)"
        >
          <span class="search-result-title">{{ doc.title }}</span>
          <span class="search-result-snippet" v-html="highlight(doc.text, query)"></span>
        </a>
      </template>
    </div>
  </div>
</template>