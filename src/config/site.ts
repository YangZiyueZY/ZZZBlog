/**
 * 站点集中配置（对标 valaxy.config.ts）：所有页面/组件统一从这里读取，
 * 一处修改全局生效。部署时仅需改 site 域名与 base 子路径。
 */
export const authorInfo = {
    name: 'KingDove',
    birth: '2005-04-29',
    avatar: 'https://q.qlogo.cn/headimg_dl?dst_uin=2097853195&spec=4',
    email: 'zamyang@qq.com',
    uid: '2097853195',
} as const;

export const siteConfig = {
    /** 部署根地址（origin，不含子路径，勿带尾斜杠；sitemap / RSS / canonical / JSON-LD 依赖） */
    site: 'https://yangziyuezy.github.io',
    /** 部署子路径：GitHub Pages 项目站点填 /仓库名；用户站点或自定义域名填 '' */
    base: '/ZZZBlog',
    lang: 'zh-CN',
    blogName: `${authorInfo.name}的个人博客`,
    description: `欢迎来到${authorInfo.name}的个人博客`,
    /** 建站年份 */
    foundedYear: 2026,
    /** 页脚版权年份 */
    copyrightYear: 2026,
    author: authorInfo,
} as const;

/** 归一化后的部署子路径（无尾斜杠；base 为 '/' 时为空串） */
const basePath = siteConfig.base.replace(/\/+$/, '');

/**
 * 给站内绝对路径补上部署子路径。外链、锚点、相对路径原样返回。
 * 站点部署在子路径（如 GitHub Pages 的 /ZZZBlog）时必须用它包裹 href/src，
 * 否则会指向域名根下不存在的地址。
 */
export function withBase(path: string): string {
    if (!path.startsWith('/')) return path;
    return `${basePath}${path}`;
}

/** 去掉路径开头的部署子路径，用于与站内路由常量（如 '/article'）比较 */
export function stripBase(pathname: string): string {
    if (basePath && pathname.startsWith(basePath)) return pathname.slice(basePath.length) || '/';
    return pathname;
}

