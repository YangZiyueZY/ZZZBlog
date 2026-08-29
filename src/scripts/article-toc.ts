/**
 * 文章详情页目录交互（桌面端双独立滚动面板）：
 * - 文章列与目录列各自内部滚动，页面本身不滚动
 * - 点击目录：只滚动文章列，目录保持原位
 * - 滚动监听：以文章列为观察根，高亮当前章节
 * 注意：本模块以原生 ESM 在浏览器执行，严禁顶层 return（会导致整包语法错误）。
 */
function initArticleToc(): void {
    const toc = document.querySelector<HTMLElement>('[data-role="article-toc"]');
    const article = document.querySelector<HTMLElement>('[data-role="article-scroll"]');
    if (!toc || !article) return;

    const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>('.article-toc__link'));
    const headings: HTMLElement[] = [];
    for (const link of links) {
        const id = link.getAttribute('href')?.slice(1);
        const heading = id ? document.getElementById(id) : null;
        if (heading) headings.push(heading);
    }
    if (!headings.length) return;

    const setActive = (id: string | null) => {
        links.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'location');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    // 点击目录：只滚动文章列，目录不动
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            // 始终拦截原生锚点行为，避免浏览器改动页面位置
            event.preventDefault();
            const id = link.getAttribute('href')?.slice(1);
            const target = id ? document.getElementById(id) : null;
            if (!target) return;
            const paddingTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
            const top =
                target.getBoundingClientRect().top -
                article.getBoundingClientRect().top +
                article.scrollTop -
                paddingTop;
            article.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    });

    // 滚动监听：进入文章列顶部判定带的第一个标题设为当前章节
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { root: article, rootMargin: '-1rem 0px -70% 0px' },
        );
        headings.forEach((heading) => observer.observe(heading));
    }

    setActive(headings[0].id);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArticleToc, { once: true });
} else {
    initArticleToc();
}

// 设备切换（移动端 → 桌面端）时复位页面滚动：
// 移动端在页面底部留下的滚动偏移，切回桌面后会被 overflow 锁定残留，导致整片面板错位。
// 浏览器在 resize 重新布局后可能把偏移再写回来，因此用 rAF + 延时多次强制复位。
const desktopQuery = window.matchMedia('(min-width: 768px)');
const forceResetPageScroll = () => {
    if (!desktopQuery.matches) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 60);
};
desktopQuery.addEventListener('change', forceResetPageScroll);
window.addEventListener('resize', forceResetPageScroll);
