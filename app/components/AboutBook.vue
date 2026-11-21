<script setup lang="ts">
/**
 * 关于页「快速手册」静态结构（P2：Astro → Vue SFC 迁移）
 * 对齐重构前的 AboutBook 模板：class / DOM 层级 / data-role、data-group、data-column
 * 属性 / 图片 src、alt、loading、decoding 全部保持原样。
 *
 * 默认激活状态：第 0 组、第 0 栏目、第 0 张卡片；其余加 hidden。
 * 交互逻辑（页签切换、卡片点选、键盘左右、友链跳转）留到 P3，本组件不含任何脚本与事件监听。
 */
import { aboutInfo } from '../../src/data/about'
import { withBase } from '../../src/config/site'
import { ref } from 'vue'
import { useAboutBook } from '../composables/useAboutBook'

const bookRoot = ref<HTMLElement>()
useAboutBook(bookRoot)
</script>

<template>
  <div ref="bookRoot" class="book" id="about-book">
    <div class="book_nav">
      <ul class="absolute flex flex-row items-end justify-between px-4 bottom-1/2 gap-4 text-[#BBBBBB] font-bold italic">
        <li
          v-for="(group, gi) in aboutInfo"
          :key="gi"
          data-role="group-tab"
          :data-group="gi"
          :class="[
            'px-[2.5rem] py-[.6rem] bg-[repeating-linear-gradient(110deg,transparent,transparent_4px,rgba(0,0,0,.02)_4px,rgba(0,0,0,.02)_15px),linear-gradient(150deg,#707070,#464646)] rounded-[.7rem_.7rem_0_0] text-shadow-black cursor-pointer hover:text-[#808080]',
            { active: gi === 0 },
          ]"
        >{{ group.title }}</li>
      </ul>
    </div>
    <div class="book_projection">
      <!-- clip-path 放在 style 标签内，css 代码高亮会混乱 -->
      <div class="book_clip" style="clip-path: polygon(var(--clip-size) 0, 100% 0, 100% 100%, 0 100%, 0 var(--clip-size));">
        <div class="left-bar">
          <div
            class="left-bar_clip"
            style="clip-path: polygon(calc(var(--clip-size) / 1.3) 0, 100% 0, 100% 100%, 0 100%, 0 calc(var(--clip-size) / 1.3));"
          >
            <ul class="left-bar-list flex flex-col items-center justify-start p-[0.4rem] w-full h-[85%] bg-[#4B4B4B] rounded-[0_0_1.5rem_1.5rem]">
              <template v-for="(group, gi) in aboutInfo" :key="gi">
                <li
                  v-for="(column, ci) in group.item"
                  :key="ci"
                  data-role="column-tab"
                  :data-group="gi"
                  :data-column="ci"
                  :class="[{ active: gi === 0 && ci === 0, hidden: gi !== 0 }]"
                >{{ column.title }}</li>
              </template>
            </ul>
          </div>
        </div>
        <div class="right-part">
          <div class="book-panel">
            <template v-for="(group, gi) in aboutInfo" :key="gi">
              <div
                v-for="(column, ci) in group.item"
                :key="ci"
                data-role="column-panel"
                :data-group="gi"
                :data-column="ci"
                :class="[{ hidden: !(gi === 0 && ci === 0) }]"
              >
                <div class="list-container_net-style">
                  <ul class="card-grid flex flex-wrap content-start m-4 gap-[2.5%] w-full h-full">
                    <li
                      v-for="(item, ii) in column.item"
                      :key="ii"
                      data-role="card"
                      :class="['w-[5rem]', { active: ii === 0 }]"
                    >
                      <div class="card-thumb mb-1">
                        <img
                          :src="withBase(item.icon ?? item.url)"
                          :alt="item.title"
                          class="relative block m-0 w-full border-[3px] border-solid border-[#3F3F3F] rounded-[var(--border-card-about)] cursor-pointer z-[1]"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <span class="block w-full py-1.5 px-0 text-center text-xs font-bold leading-3 text-white bg-black rounded-full cursor-pointer">{{ item.title }}</span>
                    </li>
                  </ul>
                  <div class="card-detail">
                    <div
                      v-for="(item, ii) in column.item"
                      :key="ii"
                      data-role="card-detail"
                      :class="[{ hidden: ii !== 0 }]"
                      style="z-index: 2; padding: 1rem; width: 100%;"
                    >
                      <div class="flex flex-row justify-between">
                        <h1 class="font-bold text-3xl text-shadow-black">{{ item.title }}</h1>
                        <div>
                          <img
                            :src="withBase(item.icon ?? item.url)"
                            :alt="item.title"
                            class="w-[5rem] border-[var(--border-card-about)]"
                            loading="lazy"
                            decoding="async"
                          />
                          <img
                            :src="withBase(item.icon ?? item.url)"
                            alt=""
                            aria-hidden="true"
                            class="absolute top-[2.5rem] right-[3rem] w-2/5 aspect-square z-[-1] grayscale-[1] opacity-[.3]"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      </div>
                      <div class="mt-8 whitespace-pre-line indent-[2em]">
                        <template v-if="item.description">
                          <p v-for="(paragraph, pi) in item.description.split('\n')" :key="pi">{{ paragraph }}</p>
                        </template>
                      </div>
                      <button
                        v-if="group.title === '友链'"
                        type="button"
                        :data-url="item.url"
                        class="mt-6 inline-block px-8 py-[.3rem] text-white bg-[linear-gradient(#080808,#080808),linear-gradient(#343434,#343434)] bg-clip-content border-2 border-[#080808] rounded-[2rem] font-bold italic cursor-pointer hover:bg-[linear-gradient(#151515,#151515),linear-gradient(#343434,#343434)]"
                      >前往</button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="book_page">
      <div class="absolute w-4/5 h-[99%] right-1 z-10 border-dashed border-[2px] rounded-[2rem] border-[rgba(0,0,0,0.3)]"></div>
    </div>
  </div>
</template>