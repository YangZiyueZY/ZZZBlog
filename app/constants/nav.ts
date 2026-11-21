export interface NavItem {
  title: string
  /** 裸路径，不含 base；RouterLink 自动补 base */
  href: string
  /** 移动端菜单图标 */
  icon: 'article' | 'more'
}

export const navList: NavItem[] = [
  { title: '文章', href: '/article/', icon: 'article' },
  { title: '更多', href: '/about/', icon: 'more' },
]
