/**
 * 生成 PWA / 苹果触摸图标（品牌色：深色底 + 金绿斜切高亮胶囊）。
 * 用法：node scripts/gen-pwa-icons.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F1D801"/>
      <stop offset="1" stop-color="#6bbd00"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#0b0b0b"/>
  <rect x="66" y="90" width="380" height="332" rx="166" fill="url(#g)" transform="skewX(-14)"/>
  <rect x="176" y="176" width="160" height="160" rx="80" fill="#0b0b0b" transform="skewX(-14)"/>
</svg>`;

const sizes = [
    { name: 'pwa-192.png', size: 192 },
    { name: 'pwa-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(root, 'public', name));
    console.log('生成 public/', name);
}
