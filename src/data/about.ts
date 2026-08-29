import type { AboutGroup } from '../types/about'

export const aboutInfo: AboutGroup[] = [
    {
        title: '关于我',
        item: [
            {
                title: '技术栈',
                item: [
                    {
                        title: 'Astro',
                        url: 'https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Astro.svg',
                        description: '本博客的核心框架，负责静态站点生成与路由。文章由内容集合（Content Collections）管理，搜索索引、RSS 订阅与站点地图均在构建期生成。'
                    },
                    {
                        title: 'TypeScript',
                        url: 'https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/TypeScript.svg',
                        description: '全站组件、脚本与配置均使用 TypeScript 编写，配合 astro check 在开发期完成静态类型检查，减少运行时错误。'
                    },
                    {
                        title: 'Tailwind CSS',
                        url: 'https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/TailwindCSS-Dark.svg',
                        description: '原子化 CSS 框架，通过工具类完成布局、间距与响应式适配，与 Less 共同负责全站样式。'
                    },
                    {
                        title: 'Less',
                        url: 'https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Less-Dark.svg',
                        description: 'CSS 预处理器，用于编写组件级样式、选择器层级与主题变量，配合 Tailwind 处理更复杂的样式逻辑。'
                    },
                    {
                        title: 'Markdown',
                        url: 'https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Markdown-Dark.svg',
                        description: '文章内容全部以 Markdown 编写，经 Content Collections 在构建期解析校验，并通过 remark-math 与 KaTeX 渲染数学公式。'
                    },
                ]
            },
            {
                title: '构建与部署',
                item: [
                    {
                        title: 'Git',
                        url: 'https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Git.svg',
                        description: '代码版本管理工具，支持分支管理、代码合并与远程协作。'
                    },
                    {
                        title: 'Vite',
                        url: 'https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Vite-Dark.svg',
                        description: 'Astro 底层的构建工具，开发期提供 HMR 热更新与依赖预构建，并通过 vite-plugin-pwa 为站点提供离线缓存。'
                    },
                    {
                        title: 'pnpm',
                        url: 'https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Pnpm-Dark.svg',
                        description: '本项目的包管理器，负责依赖安装与脚本管理（dev / build / preview 等）。'
                    },
                    {
                        title: 'GitHub Actions',
                        url: 'https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/GithubActions-Dark.svg',
                        description: 'CI/CD 自动化部署：push 到主分支后自动执行构建，并将产物发布到 GitHub Pages。'
                    },
                ]
            }
        ],
    },
    {
        title: '友链',
        item: [
            {
                title: '朋友们',
                item: [
                    {
                        title: 'Paper2Galgame',
                        url: 'https://paper2gal.com',
                        icon: 'https://paper2gal.com/apple-touch-icon.png',
                        description: 'AI 驱动的论文学习工具：把学术论文转化为互动视觉小说，上传 PDF 即可与动漫搭档对话，让研读文献更有代入感。'
                    },
                    {
                        title: '绳网',
                        url: 'https://interk.net',
                        icon: 'https://interk.net/icon/globe-512x512.png',
                        description: '新艾利都最大的匿名委托中枢，一个以《绝区零》为主题的虚拟网络社区。'
                    },
                ]
            }
        ]
    }
]
