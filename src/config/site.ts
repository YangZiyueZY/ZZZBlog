/**
 * 站点集中配置（对标 valaxy.config.ts）：所有页面/组件统一从这里读取，
 * 一处修改全局生效。部署时仅需改 site 域名。
 */
export const authorInfo = {
    name: 'KingDove',
    birth: '2005-04-29',
    avatar: 'https://q.qlogo.cn/headimg_dl?dst_uin=2097853195&spec=4',
    email: 'zamyang@qq.com',
    uid: '2097853195',
} as const;

export const siteConfig = {
    /** 部署域名（sitemap / RSS / canonical / JSON-LD 依赖，勿带尾斜杠） */
    site: 'https://blog.shumuxi.cfd',
    lang: 'zh-CN',
    blogName: `${authorInfo.name}的个人博客`,
    description: `欢迎来到${authorInfo.name}的个人博客`,
    /** 建站年份 */
    foundedYear: 2026,
    /** 页脚版权年份 */
    copyrightYear: 2026,
    author: authorInfo,
} as const;
