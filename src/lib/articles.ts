/**
 * 构建期文章统计：阅读时长与字数（中英文混排口径，中文按字、英文按词）。
 */
export function countWords(text: string): number {
    const zh = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
    const en = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g) ?? []).length;
    return zh + en;
}

export function articleStats(body: string): { wordCount: number; readingTime: number } {
    const plain = body
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/[#>*`|~\-_]|^\s*[-+]\s+/gm, ' ')
        .replace(/\s+/g, ' ');
    const wordCount = countWords(plain);
    return { wordCount, readingTime: Math.max(1, Math.round(wordCount / 300)) };
}
