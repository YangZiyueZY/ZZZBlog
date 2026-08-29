/**
 * 瀑布流：与原版逻辑一致，图片加载完成后按卡片高度计算 grid-row span。
 * 原版每次 img load 都会重算所有卡片，这里只处理当前卡片，消除布局抖动。
 */
const ROW_HEIGHT = 20;

function applySpan(card: HTMLElement): void {
    card.style.gridRowEnd = `span ${Math.ceil(card.clientHeight / ROW_HEIGHT) + 1}`;
}

function initMasonry(): void {
    const grid = document.querySelector<HTMLElement>('[data-masonry]');
    if (!grid) return;

    grid.querySelectorAll<HTMLElement>('[data-masonry-item]').forEach((card) => {
        const cover = card.querySelector<HTMLElement>('.card-cover');
        const img = card.querySelector('img');

        const done = () => {
            cover?.classList.add('loaded');
            applySpan(card);
        };

        if (img && !img.complete) {
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
        } else {
            done();
        }
    });
}

initMasonry();
