<script setup lang="ts">
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { ref } from 'vue'
import { authorInfo, siteConfig, withBase } from '../../src/config/site'
import { aboutInfo } from '../../src/data/about'
import { projects } from '../../src/data/projects'
import profileImages from '../../.content/profile-images.json'
import { useBackButton } from '../composables/useBackButton'
import { useProfilePage } from '../composables/useProfilePage'

// 构建期时间：vite.config.ts 中 define 注入（ISO 字符串），禁止运行期 new Date()
const buildTime = new Date(__BUILD_TIME__)

// 等级/经验与 AppAuthor 同一套构建期公式（按出生天数折算）
const days = Math.ceil((buildTime.getTime() - new Date(authorInfo.birth).getTime()) / 86400000)
const level = Math.floor(days / 365)

const uid = authorInfo.uid
const signDate = '4月20日'

// 「工具」页签内容：从原「关于我」分组迁移，含技术栈与构建部署
const toolsGroup = aboutInfo.find((group) => group.title === '工具') ?? aboutInfo[0]

const backPressed = ref<HTMLElement>()
const { onBack } = useBackButton(backPressed)
const profileRoot = ref<HTMLElement>()
useProfilePage(profileRoot)

// 徽章 / CG 均由 public/img/profile 构建期扫描，最多各 6 张
const badges = profileImages.badges as string[]
const cgImages = profileImages.cg as string[]

</script>

<template>
  <DefaultLayout
    hide-header
    :title="`个人主页 - ${siteConfig.blogName}`"
    :description="`${authorInfo.name}的个人主页`"
  >
    <div ref="profileRoot" class="relative min-h-[100vh] profile-page">
      <button class="back-button" type="button" aria-label="返回上一页" @click="onBack"></button>
      <div ref="backPressed" class="back-button_pressed"></div>

      <!-- 页签切换（个人主页 / 关于），样式与顶部导航页签同款：悬浮/激活高亮闪烁 -->
      <div class="profile-tabs" role="tablist" aria-label="个人主页视图切换">
        <button type="button" class="active" data-role="profile-tab" data-view="home" aria-selected="true">
          <span>个人主页</span>
          <div class="bg absolute top-1/2 left-1/2 w-[9.5rem] h-[2.5rem] rounded-[.5rem_1rem] -translate-x-1/2 -translate-y-1/2 skew-x-[var(--inclination-degree)] z-[-1]"></div>
        </button>
        <button type="button" data-role="profile-tab" data-view="tools" aria-selected="false">
          <span>关于</span>
          <div class="bg absolute top-1/2 left-1/2 w-[9.5rem] h-[2.5rem] rounded-[.5rem_1rem] -translate-x-1/2 -translate-y-1/2 skew-x-[var(--inclination-degree)] z-[-1]"></div>
        </button>
      </div>

      <!-- ===== 视图一：个人主页 ===== -->
      <section data-role="profile-view" data-view="home" class="profile-panel" aria-label="个人主页">
        <div class="profile-topbar">
          <button type="button" class="profile-uid" data-role="uid-copy" title="点击复制 UID">
            <span>UID: {{ uid }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
              <path d="M5 15V6a2 2 0 0 1 2-2h9" fill="none" stroke="currentColor" stroke-width="2"></path>
            </svg>
          </button>
          <!-- 更多操作：本页无站点导航，提供真实可用的快捷操作 -->
          <div class="profile-more-wrap">
            <button type="button" class="profile-more" data-role="more-toggle" aria-haspopup="menu" aria-expanded="false" aria-controls="profile-more-menu">更多操作</button>
            <div id="profile-more-menu" class="profile-more-menu" role="menu" aria-label="更多操作">
              <a role="menuitem" :href="withBase('/article/')">文章列表</a>
              <a role="menuitem" :href="withBase('/about/')">更多</a>
              <a role="menuitem" :href="withBase('/rss.xml')">RSS 订阅</a>
              <button role="menuitem" type="button" data-role="share-copy">复制本页链接</button>
            </div>
          </div>
        </div>

        <!-- 名片横幅 -->
        <div class="profile-banner">
          <span class="profile-banner-art" aria-hidden="true">ZZZ</span>
          <div class="profile-banner-left">
            <div class="profile-avatar">
              <span class="profile-avatar-level">{{ level }}</span>
              <img :src="withBase(authorInfo.avatar)" :alt="`${authorInfo.name}的头像`" loading="eager" decoding="async" />
            </div>
            <div class="profile-banner-info">
              <h1 class="profile-name">{{ authorInfo.name }}</h1>
              <p class="profile-greeting">欢迎来到，KingDove的主页</p>
            </div>
            <div v-if="badges.length" class="profile-medals">
              <img
                v-for="(badge, index) in badges"
                :key="badge"
                :src="withBase(badge)"
                :alt="`徽章 ${index + 1}`"
                :title="`徽章 ${index + 1}`"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        <!-- 签名条 -->
        <div class="profile-sign">
          <span class="profile-sign-text">咕？咕……咕！</span>
          <span class="profile-sign-date">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
              <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" fill="none"></path>
            </svg>
            {{ signDate }}
          </span>
        </div>

        <!-- ===== 项目 ===== -->
        <section v-if="projects.length" class="profile-section" aria-labelledby="profile-projects">
          <div class="profile-section-head">
            <div>
              <span class="profile-section-en" aria-hidden="true">PROJECTS</span>
              <h2 id="profile-projects">项目</h2>
            </div>
            <a class="profile-section-link" href="https://github.com/YangZiyueZY" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </div>
          <div class="profile-projects">
            <article v-for="project in projects" :key="project.name" class="profile-project">
              <div class="profile-project-top">
                <div class="profile-project-title">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
                  <h3><a :href="project.url" target="_blank" rel="noopener noreferrer">{{ project.name }}</a></h3>
                </div>
                <a class="profile-project-arrow" :href="project.url" target="_blank" rel="noopener noreferrer" :aria-label="`打开 ${project.name}`">↗</a>
              </div>
              <p class="profile-project-desc">{{ project.description }}</p>
              <div class="profile-project-tags">
                <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
              </div>
              <div class="profile-project-meta">
                <span class="profile-project-owner">{{ project.owner }}</span>
                <span class="profile-project-lang"><i :style="{ background: project.languageColor }"></i>{{ project.language }}</span>
                <span>★ {{ project.stars }}</span>
                <span>⑂ {{ project.forks }}</span>
                <span>更新 {{ project.updated.replaceAll('-', '.') }}</span>
                <span class="profile-project-license">{{ project.license }}</span>
              </div>
              <div class="profile-project-actions">
                <a :href="project.url" target="_blank" rel="noopener noreferrer">查看源码</a>
                <a v-if="project.demo" :href="project.demo" target="_blank" rel="noopener noreferrer">在线体验</a>
              </div>
            </article>
          </div>
        </section>

        <div v-if="cgImages.length" class="profile-section-head profile-section-head--gallery">
          <div>
            <span class="profile-section-en" aria-hidden="true">GALLERY</span>
            <h2>画廊</h2>
          </div>
        </div>
        <!-- CG 矩形图（读取 public/img/profile/cg，最多 6 张） -->
        <div
          v-if="cgImages.length"
          class="profile-slots"
          :class="{ 'profile-slots--one': cgImages.length === 1, 'profile-slots--two': cgImages.length === 2 }"
        >
          <div v-for="(image, index) in cgImages" :key="image" class="profile-slot" :title="`CG ${index + 1}`">
            <img :src="withBase(image)" :alt="`CG ${index + 1}`" loading="lazy" decoding="async" />
          </div>
        </div>

        <span class="profile-watermark" aria-hidden="true">UID: {{ uid }}</span>
      </section>

      <!-- ===== 视图二：关于（原「关于我」内容） ===== -->
      <section data-role="profile-view" data-view="tools" class="profile-panel profile-tools hidden" aria-label="关于">
        <div class="profile-tools-head">
          <div>
            <span class="profile-tools-en" aria-hidden="true">ABOUT</span>
            <h2>关于</h2>
          </div>
          <p>建站技术栈与常用工具，按「技术栈 / 构建与部署」分组。</p>
        </div>
        <div class="profile-tools-groups">
          <section v-for="column in toolsGroup.item" :key="column.title" class="profile-tool-group">
            <h3>{{ column.title }}</h3>
            <div class="profile-tool-grid">
              <article v-for="item in column.item" :key="item.title" class="profile-tool-card">
                <img :src="withBase(item.icon ?? item.url)" :alt="item.title" loading="lazy" decoding="async" />
                <div class="profile-tool-body">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.description }}</p>
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>
    </div>
  </DefaultLayout>
</template>