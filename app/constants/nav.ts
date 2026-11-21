export interface NavItem {
  title: string
  /** 裸路径，不含 base；RouterLink 自动补 base */
  href: string
}

export const navList: NavItem[] = [
  { title: '文章', href: '/article/' },
  { title: '更多', href: '/about/' },
]
