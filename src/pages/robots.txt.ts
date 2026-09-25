import type { APIRoute } from 'astro';
import { siteConfig, withBase } from '../config/site';

/** 由站点配置生成，避免部署子路径/域名改动后 sitemap 地址与站点实际地址不一致 */
export const GET: APIRoute = () => {
    const body = ['User-Agent: *', 'Disallow:', '', `Sitemap: ${siteConfig.site}${withBase('/sitemap-index.xml')}`, ''].join('\n');

    return new Response(body, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
