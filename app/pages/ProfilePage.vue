<script setup lang="ts">
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { ref } from 'vue'
import { authorInfo, siteConfig, withBase } from '../../src/config/site'
import { aboutInfo } from '../../src/data/about'
import { useBackButton } from '../composables/useBackButton'
import { useProfilePage } from '../composables/useProfilePage'

// 构建期时间：vite.config.ts 中 define 注入（ISO 字符串），禁止运行期 new Date()
const buildTime = new Date(__BUILD_TIME__)

// 等级/经验与 AppAuthor 同一套构建期公式（按出生天数折算）
const days = Math.ceil((buildTime.getTime() - new Date(authorInfo.birth).getTime()) / 86400000)
const level = Math.floor(days / 365)
const currentExp = days
const totalExp = (level + 1) * 365
const expPercentage = Math.min(100, (currentExp / totalExp) * 100)

const uid = authorInfo.uid
const signDate = __BUILD_DATE_LABEL__

// 文章数量：P2 改为内容层注入（届时从内容集合统计替换此常量）
const articleCount = 14

// 「工具」页签内容：从原「关于我」分组迁移，含技术栈与构建部署
const toolsGroup = aboutInfo.find((group) => group.title === '工具') ?? aboutInfo[0]

const backPressed = ref<HTMLElement>()
const { onBack } = useBackButton(backPressed)
const profileRoot = ref<HTMLElement>()
useProfilePage(profileRoot)

// 当前权益（游戏味文案 + 博客真实数据）
const benefits = [
  { label: '文章数量', value: `${articleCount} 篇` },
  { label: '站长等级', value: `${level} 级` },
  { label: '建站时间', value: `${siteConfig.foundedYear} 年` },
  { label: 'RSS 订阅', value: '已开放' },
  { label: '图片放大预览', value: '已开放' },
  { label: '深色模式', value: '永久生效' },
  { label: '评论区', value: '施工中' },
  { label: '绳网声望', value: 'MAX' },
]

// 名片墙上的勋章（复用关于页的技术栈徽章；已本地化到 public/img/icons/）
const medals = [
  { name: 'Git', url: '/img/icons/git.svg' },
  { name: 'Vue', url: '/img/icons/vuejs-dark.svg' },
  { name: 'TypeScript', url: '/img/icons/typescript.svg' },
]

const slots = ['名片位 1', '名片位 2', '名片位 3', '名片位 4', '名片位 5', '名片位 6']

// 外链保留 target/rel（站内链接不渲染这两个属性）
const isExternal = (href: string) => href.startsWith('http')

const actions = [
  { label: '修改头像', href: 'https://q.qlogo.cn', isNew: true },
  { label: '修改称号', href: withBase('/about/'), isNew: false },
  { label: '修改勋章', href: withBase('/about/'), isNew: false },
  { label: '修改名片', href: 'https://github.com/yang-zhihang', isNew: true },
]
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

      <!-- 页签切换（个人主页 / 绳匠档案），样式与顶部导航页签同款：悬浮/激活高亮闪烁 -->
      <div class="profile-tabs" role="tablist" aria-label="个人主页视图切换">
        <button type="button" class="active" data-role="profile-tab" data-view="home" aria-selected="true">
          <span>个人主页</span>
          <div class="bg absolute top-1/2 left-1/2 w-[9.5rem] h-[2.5rem] rounded-[.5rem_1rem] -translate-x-1/2 -translate-y-1/2 skew-x-[var(--inclination-degree)] z-[-1]"></div>
        </button>
        <button type="button" data-role="profile-tab" data-view="keeper" aria-selected="false">
          <span>绳匠档案</span>
          <div class="bg absolute top-1/2 left-1/2 w-[9.5rem] h-[2.5rem] rounded-[.5rem_1rem] -translate-x-1/2 -translate-y-1/2 skew-x-[var(--inclination-degree)] z-[-1]"></div>
        </button>
        <button type="button" data-role="profile-tab" data-view="tools" aria-selected="false">
          <span>工具</span>
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
            <div class="profile-medals">
              <img
                v-for="medal in medals"
                :key="medal.name"
                :src="withBase(medal.url)"
                :alt="`${medal.name} 勋章`"
                :title="medal.name"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        <!-- 签名条 -->
        <div class="profile-sign">
          <span class="profile-sign-text">这里什么都没有…</span>
          <span class="profile-sign-date">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
              <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" fill="none"></path>
            </svg>
            {{ signDate }}
          </span>
        </div>

        <!-- 名片槽位 -->
        <div class="profile-slots">
          <div v-for="slot in slots" :key="slot" class="profile-slot" :title="slot">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"></path>
            </svg>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="profile-actions">
          <a
            v-for="action in actions"
            :key="action.label"
            class="profile-action"
            :href="action.href"
            :target="isExternal(action.href) ? '_blank' : undefined"
            :rel="isExternal(action.href) ? 'noopener noreferrer' : undefined"
          >
            <span v-if="action.isNew" class="profile-action-new" aria-hidden="true">NEW!</span>
            <span>{{ action.label }}</span>
          </a>
        </div>

        <span class="profile-watermark" aria-hidden="true">UID: {{ uid }}</span>
      </section>

      <!-- ===== 视图二：绳匠档案 ===== -->
      <section data-role="profile-view" data-view="keeper" class="profile-keeper hidden" aria-label="绳匠档案">
        <!-- 左侧档案卡 -->
        <div class="profile-keeper-card">
          <h2 class="profile-keeper-title">传奇站长</h2>
          <div class="profile-keeper-emblem" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <defs>
                <linearGradient id="profile-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#FFD84D"></stop>
                  <stop offset="1" stop-color="#E8930C"></stop>
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="none" stroke="url(#profile-gold)" stroke-width="7"></circle>
              <circle cx="50" cy="50" r="25" fill="none" stroke="url(#profile-gold)" stroke-width="5"></circle>
              <path d="M50 18 L57 43 L82 50 L57 57 L50 82 L43 57 L18 50 L43 43 Z" fill="url(#profile-gold)"></path>
            </svg>
          </div>
          <div class="profile-keeper-id">
            <img :src="withBase(authorInfo.avatar)" :alt="`${authorInfo.name}的头像`" loading="lazy" decoding="async" />
            <div>
              <div class="profile-keeper-name">{{ authorInfo.name }}</div>
              <div class="profile-keeper-uid">UID: {{ uid }}</div>
            </div>
          </div>
          <div class="profile-keeper-level">
            <span class="profile-keeper-level-label">等级{{ level }}</span>
            <span class="profile-keeper-level-exp">{{ currentExp }}/{{ totalExp }}</span>
            <div class="profile-levelbar">
              <div class="profile-levelbar-fill" :style="{ width: `${expPercentage}%` }"></div>
            </div>
          </div>
          <a class="profile-keeper-btn" :href="withBase('/about/')">绳网等级</a>
        </div>

        <!-- 右侧当前权益 -->
        <div class="profile-benefits">
          <div class="profile-benefits-head">
            <h2>当前权益</h2>
            <span class="profile-benefits-en" aria-hidden="true">BENEFITS</span>
          </div>
          <button type="button" class="profile-benefit-arrow" data-role="benefit-up" aria-label="向上滚动权益列表">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
            </svg>
          </button>
          <div class="profile-benefit-list" data-role="benefit-list">
            <div v-for="benefit in benefits" :key="benefit.label" class="profile-benefit-row">
              <span class="profile-benefit-label">{{ benefit.label }}</span>
              <span class="profile-benefit-value">{{ benefit.value }}</span>
            </div>
          </div>
          <button type="button" class="profile-benefit-arrow profile-benefit-arrow-down" data-role="benefit-down" aria-label="向下滚动权益列表">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
            </svg>
          </button>
          <span class="profile-max-mark" aria-hidden="true">MAX</span>
          <p class="profile-benefit-note">绳网声望已达到最大级</p>
          <button type="button" class="profile-benefit-disabled" disabled>绳网声望已达到最大级</button>
        </div>
      </section>

      <!-- ===== 视图三：工具（原「关于我」内容） ===== -->
      <section data-role="profile-view" data-view="tools" class="profile-panel profile-tools hidden" aria-label="工具">
        <div class="profile-tools-head">
          <div>
            <span class="profile-tools-en" aria-hidden="true">TOOLKIT</span>
            <h2>工具</h2>
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