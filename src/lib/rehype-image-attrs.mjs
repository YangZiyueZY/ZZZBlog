import { visit } from 'unist-util-visit';
import { imageSize } from 'image-size';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 构建期为 markdown 图片补上固有尺寸（防 CLS），并把 public/ 下的本地图片
 * 补上部署子路径（站点部署在子路径时，/img/x.webp 需变成 /ZZZBlog/img/x.webp）。
 * 懒加载 / 异步解码由 Astro 原生提供；外链跳过。
 * 注意：Astro 5 会缓存内容渲染结果（node_modules/.astro），改动本插件后需清缓存重建。
 *
 * @param {{ base?: string }} [options] 部署子路径，如 '/ZZZBlog'（默认根域部署）
 */
export default function rehypeImageAttrs(options = {}) {
  const base = (options.base ?? '').replace(/\/+$/, '');

  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const props = node.properties ?? (node.properties = {});
      const src = typeof props.src === 'string' ? props.src : undefined;
      if (!src || !src.startsWith('/')) return;
      // 尺寸探测始终针对 public/ 下的真实文件路径，与最终输出的带 base 地址无关
      const publicPath = base && src.startsWith(`${base}/`) ? src.slice(base.length) : src;
      if (!(props.width && props.height)) {
        try {
          // markdown 里的中文文件名会被百分号编码，需先解码再定位磁盘文件
          const decoded = decodeURIComponent(publicPath);
          const file = resolve(process.cwd(), 'public', decoded.slice(1));
          const { width, height } = imageSize(readFileSync(file));
          props.width = width;
          props.height = height;
        } catch {
          // 图片读取失败时不加尺寸，保持原渲染
        }
      }
      props.src = `${base}${publicPath}`;
    });
  };
}
