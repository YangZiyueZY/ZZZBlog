<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import AppAuthor from './AppAuthor.vue'
import SearchBox from './SearchBox.vue'
import { navList } from '../constants/nav'
import { stripBase } from '../../src/config/site'

const route = useRoute()
const isArticlePage = computed(() => stripBase(route.path).startsWith('/article'))
const isActive = (href: string) => stripBase(route.path).startsWith(href)

const menuButton = ref<HTMLButtonElement>()
const mobileMenu = ref<HTMLElement>()
const menuOpen = ref(false)

const setMenu = (open: boolean) => {
  menuOpen.value = open
}

const onDocumentClick = (event: MouseEvent) => {
  if (!menuOpen.value) return
  const node = event.target as Node
  if (mobileMenu.value?.contains(node) || menuButton.value?.contains(node)) return
  setMenu(false)
}
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') setMenu(false)
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header class="flex fixed items-center justify-between top-0 w-full h-[var(--height-header)] bg-black z-50">
    <AppAuthor />
    <SearchBox variant="inline" />
    <ul class="nav-pc relative flex shrink-0 justify-around items-center p-0 mr-4 h-[2.2rem] bg-[#050505] rounded-[2rem] border-[3px] border-[#383838] shadow-[0_0_0_1px_rgba(255,255,255,.1),inset_0_0_4px_rgba(0,0,0,1)]">
      <li v-for="nav in navList" :key="nav.href" class="w-[9rem] text-white text-center font-bold italic cursor-pointer align-middle">
        <RouterLink :to="nav.href" class="relative z-0 hover:text-[#808080]" :class="{ active: isActive(nav.href) }">{{ nav.title }}<div class="bg absolute top-1/2 left-1/2 w-[9.5rem] h-[2.5rem] rounded-[.5rem_1rem] -translate-x-1/2 -translate-y-1/2 skew-x-[var(--inclination-degree)] z-[-1]" /></RouterLink>
      </li>
    </ul>
    <div class="mobile-menu-wrapper relative h-full aspect-square">
      <button ref="menuButton" class="mobile-menu" type="button" aria-label="打开导航菜单" :aria-expanded="menuOpen" aria-controls="nav-mobile" @click="setMenu(!menuOpen)">
        <span class="absolute block top-1/2 left-0 bg-[#232323] w-[70%] h-[6px] rounded-full"></span>
        <span class="absolute block top-1/2 left-0 bg-[#232323] w-[70%] h-[6px] rounded-full"></span>
        <span class="absolute block top-1/2 left-0 bg-[#232323] w-[70%] h-[6px] rounded-full"></span>
      </button>
    </div>
    <div id="nav-mobile" ref="mobileMenu" class="nav-mobile absolute top-[var(--height-header)] right-0 p-2 bg-[#050505] rounded-[1rem] border-[3px] border-[#383838]" :class="{ open: menuOpen }">
      <SearchBox v-if="!isArticlePage" variant="menu" />
      <ul class="nav-mobile-list">
        <li v-for="nav in navList" :key="nav.href" class="relative flex justify-center items-center p-0 w-36 h-10 text-white text-center font-bold italic bg-[#050505] rounded-[2rem] border-[3px] border-[#383838] shadow-[0_0_0_1px_rgba(255,255,255,.1),inset_0_0_4px_rgba(0,0,0,1)] align-middle">
          <RouterLink :to="nav.href" class="relative z-0 hover:text-[#808080]" :class="{ active: isActive(nav.href) }">{{ nav.title }}<div class="bg absolute top-1/2 left-1/2 w-[9.5rem] h-[2.5rem] rounded-[2rem] -translate-x-1/2 -translate-y-1/2 z-[-1]" /></RouterLink>
        </li>
      </ul>
    </div>
  </header>
</template>