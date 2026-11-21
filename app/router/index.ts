import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'root', component: () => import('../pages/RedirectPage.vue') },
  { path: '/article/', name: 'articles', component: () => import('../pages/ArticleListPage.vue') },
  { path: '/article/:id/', name: 'article', component: () => import('../pages/ArticleDetailPage.vue') },
  { path: '/about/', name: 'about', component: () => import('../pages/AboutPage.vue') },
  { path: '/profile/', name: 'profile', component: () => import('../pages/ProfilePage.vue') },
  { path: '/404/', name: 'not-found', component: () => import('../pages/NotFoundPage.vue') },
  { path: '/:pathMatch(.*)*', name: 'catch-all', component: () => import('../pages/NotFoundPage.vue') },
]
