export interface ProjectItem {
  name: string
  owner: string
  url: string
  description: string
  language: string
  languageColor: string
  stars: number
  forks: number
  updated: string
  license: string
  demo?: string
  tags: string[]
}

/** 个人主页项目卡片；数据来自各仓库的 GitHub 元信息与 README。 */
export const projects: ProjectItem[] = [
  {
    name: 'KingDoveStudio',
    owner: 'YangZiyueZY',
    url: 'https://github.com/YangZiyueZY/KingDoveStudio',
    description:
      '两个自用的媒体解析 / 下载工具合集：网易云音乐与哔哩哔哩解析下载，支持音质与清晰度选择、弹幕字幕、ZIP 打包、任务队列等。',
    language: 'Python',
    languageColor: '#3572A5',
    stars: 0,
    forks: 0,
    updated: '2026-11-01',
    license: 'Apache-2.0',
    tags: ['Flask', '网易云音乐', 'Bilibili'],
  },
  {
    name: 'AutoTapper',
    owner: 'JX-Lab',
    url: 'https://github.com/JX-Lab/AutoTapper',
    description:
      '轻量 Android 自动点击器，基于无障碍服务在任意应用中悬浮取点，并按顺序轮流点击多个位置。',
    language: 'Kotlin',
    languageColor: '#A97BFF',
    stars: 12,
    forks: 12,
    updated: '2026-11-20',
    license: 'MIT',
    tags: ['Android', '无障碍服务', '自动化'],
  },
  {
    name: 'GenshinSandroneHanoi',
    owner: 'YangZiyueZY',
    url: 'https://github.com/YangZiyueZY/GenshinSandroneHanoi',
    description:
      '基于 React + Three.js 的 3D 汉诺塔小游戏，复刻《原神》中愚人众执行官「木偶」桑多涅的齿轮汉诺塔玩法。',
    language: 'TypeScript',
    languageColor: '#3178C6',
    stars: 0,
    forks: 0,
    updated: '2026-09-05',
    license: 'MIT',
    demo: 'https://yangziyuezy.github.io/GenshinSandroneHanoi/',
    tags: ['React', 'Three.js', '游戏'],
  },
  {
    name: 'PureWriterUpdata',
    owner: 'YangZiyueZY',
    url: 'https://github.com/YangZiyueZY/PureWriterUpdata',
    description:
      '给 Pure Writer 2 桌面版配套的本地文章提取工具：只读 SQLite，在浏览器里浏览、搜索并导出 Markdown / TXT / DOCX。',
    language: 'Python',
    languageColor: '#3572A5',
    stars: 0,
    forks: 0,
    updated: '2026-09-05',
    license: 'MIT',
    tags: ['Python', 'SQLite', 'WebUI'],
  },
]
