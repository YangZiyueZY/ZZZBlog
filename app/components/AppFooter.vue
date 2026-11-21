<script setup lang="ts">
import { authorInfo, siteConfig } from '../../src/config/site'
</script>

<template>
  <footer class="flex flex-col items-center justify-center py-[10px] w-full h-[var(--height-footer)] bg-black text-white text-[1rem] font-bold">
    <div>
      <span>Copyright © {{ siteConfig.copyrightYear }} {{ authorInfo.name }}'s Blog. All Rights Reserved.</span>
    </div>
  </footer>
</template>
