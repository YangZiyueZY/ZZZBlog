<script setup lang="ts">
import { authorInfo } from '../../src/config/site'

const lines = [`${authorInfo.name}'s Blog`, `'s Blog ${authorInfo.name}`, `${authorInfo.name}'s Blog`]
</script>

<template>
  <div class="background">
    <div class="slide-container">
      <div class="text-container">
        <div v-for="line in lines" :key="line" class="text-line">{{ line }}</div>
      </div>
      <div class="text-container-dst">
        <div v-for="line in lines" :key="line" class="text-line">{{ line }}</div>
      </div>
    </div>
  </div>
</template>
