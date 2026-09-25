import type { NavItem } from "../types/nav"
import { withBase } from "../config/site"

export const navList: NavItem[] = [
    {
        title: '文章',
        href: withBase('/article/'),
    },
    {
        title: '关于',
        href: withBase('/about/'),
    },
]
