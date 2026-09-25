import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig, authorInfo, withBase } from '../config/site';

export async function GET() {
    const articles = (await getCollection('articles')).sort((a, b) => a.data.id - b.data.id);
    // 站点部署在子路径时，feed 的频道地址与条目链接都要带上 base
    const siteUrl = `${siteConfig.site}${withBase('/')}`;

    return rss({
        title: siteConfig.blogName,
        description: siteConfig.description,
        site: siteUrl,
        items: articles.map((entry) => ({
            title: entry.data.title,
            description: entry.data.description,
            link: withBase(`/article/${entry.data.id}/`),
            pubDate: new Date(entry.data.createTime),
            categories: entry.data.tags,
            author: `${authorInfo.email} (${authorInfo.name})`,
        })),
    });
}
