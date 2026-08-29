import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig, authorInfo } from '../config/site';

export async function GET(context) {
    const articles = (await getCollection('articles')).sort((a, b) => a.data.id - b.data.id);

    return rss({
        title: siteConfig.blogName,
        description: siteConfig.description,
        site: context.site,
        items: articles.map((entry) => ({
            title: entry.data.title,
            description: entry.data.description,
            link: `/article/${entry.data.id}/`,
            pubDate: new Date(entry.data.createTime),
            categories: entry.data.tags,
            author: `${authorInfo.email} (${authorInfo.name})`,
        })),
    });
}
