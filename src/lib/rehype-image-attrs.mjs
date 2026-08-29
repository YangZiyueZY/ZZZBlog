import { visit } from 'unist-util-visit';
import { imageSize } from 'image-size';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 构建期为 markdown 图片补上固有尺寸（防 CLS）。
 * 懒加载 / 异步解码由 Astro 原生提供；这里只处理 public/ 下的本地图片，外链跳过。
 * 注意：Astro 5 会缓存内容渲染结果（node_modules/.astro），改动本插件后需清缓存重建。
 */
export default function rehypeImageAttrs() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const props = node.properties ?? (node.properties = {});
      const src = typeof props.src === 'string' ? props.src : undefined;
      if (!src || !src.startsWith('/')) return;
      if (props.width && props.height) return;
      try {
        // markdown 里的中文文件名会被百分号编码，需先解码再定位磁盘文件
        const decoded = decodeURIComponent(src);
        const file = resolve(process.cwd(), 'public', decoded.slice(1));
        const { width, height } = imageSize(readFileSync(file));
        props.width = width;
        props.height = height;
      } catch {
        // 图片读取失败时不加尺寸，保持原渲染
      }
    });
  };
}
