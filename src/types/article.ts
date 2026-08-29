export type ArticleMeta = {
    id: number;
    title: string;
    description: string;
    views: number;
    createTime: string;
    modifiedTime: string;
    cover: string[];
    tags: string[];
    categories: string[];
    /** 构建期计算：中文字数 + 英文单词数 */
    wordCount: number;
    /** 构建期计算：按 300 字/分钟折算 */
    readingTime: number;
}
