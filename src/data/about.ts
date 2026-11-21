import type { AboutGroup } from '../types/about'

export const aboutInfo: AboutGroup[] = [
    {
        title: '工具',
        item: [
            {
                title: '技术栈',
                item: [
                    {
                        title: 'Vue 3',
                        url: '/img/icons/vuejs-dark.svg',
                        description: '本博客的 UI 框架，配合 Vue Router 管理页面与交互；vite-ssg 在构建期把每个路由预渲染成静态 HTML，保留 SEO 与首屏体验。'
                    },
                    {
                        title: 'TypeScript',
                        url: '/img/icons/typescript.svg',
                        description: '全站组件、脚本与配置均使用 TypeScript 编写，配合 vue-tsc 完成静态类型检查，减少运行时错误。'
                    },
                    {
                        title: 'Tailwind CSS',
                        url: '/img/icons/tailwindcss-dark.svg',
                        description: '原子化 CSS 框架，通过工具类完成布局、间距与响应式适配，与 Less 共同负责全站样式。'
                    },
                    {
                        title: 'Less',
                        url: '/img/icons/less-dark.svg',
                        description: 'CSS 预处理器，用于编写组件级样式、选择器层级与主题变量，配合 Tailwind 处理更复杂的样式逻辑。'
                    },
                    {
                        title: 'Markdown',
                        url: '/img/icons/markdown-dark.svg',
                        description: '文章内容全部以 Markdown 编写，构建期经 zod 校验与 unified 管线渲染，并通过 remark-math 与 KaTeX 渲染数学公式。'
                    },
                ]
            },
            {
                title: '构建与部署',
                item: [
                    {
                        title: 'Git',
                        url: '/img/icons/git.svg',
                        description: '代码版本管理工具，支持分支管理、代码合并与远程协作。'
                    },
                    {
                        title: 'Vite',
                        url: '/img/icons/vite-dark.svg',
                        description: 'Vue 应用的构建工具，开发期提供 HMR 与依赖预构建；构建期由 vite-ssg 预渲染页面，并通过 vite-plugin-pwa 提供离线缓存。'
                    },
                    {
                        title: 'pnpm',
                        url: '/img/icons/pnpm-dark.svg',
                        description: '本项目的包管理器，负责依赖安装与脚本管理（dev / build / preview 等）。'
                    },
                    {
                        title: 'GitHub Actions',
                        url: '/img/icons/githubactions-dark.svg',
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
                        icon: '/img/friends/paper2gal.png',
                        description: 'AI 驱动的论文学习工具：把学术论文转化为互动视觉小说，上传 PDF 即可与动漫搭档对话，让研读文献更有代入感。'
                    },
                    {
                        title: '绳网',
                        url: 'https://interk.net',
                        icon: '/img/globe-white.png',
                        description: '新艾利都最大的匿名委托中枢，一个以《绝区零》为主题的虚拟网络社区。'
                    },
                ]
            }
        ]
    }
]
