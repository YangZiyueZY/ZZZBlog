/**
 * 文章详情页交互：
 * - 回退按钮：按压闪烁 0.3s 后返回（原 GSAP 实现 → CSS 关键帧）
 * - 图片放大预览：事件委托 + CSS 动画开关（原 GSAP timeline → CSS keyframes）
 * - 代码块复制按钮：构建期样式已就位，这里负责注入与剪贴板交互
 */

// ===== 回退按钮 start =====
const backButton = document.querySelector<HTMLElement>('.back-button');
const backPressed = document.querySelector<HTMLElement>('.back-button_pressed');

backButton?.addEventListener('click', () => {
    if (backPressed?.classList.contains('flashing')) return;
    backPressed?.classList.add('flashing');
    window.setTimeout(() => window.history.back(), 300);
});
// ===== 回退按钮 end =====

// ===== 图片放大预览 start =====
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-image') as HTMLImageElement | null;
const closeButton = document.querySelector<HTMLElement>('.image-modal .close-button');
const closePressed = document.querySelector<HTMLElement>('.image-modal .close-button_pressed');

const openModal = (src: string) => {
    if (!modal || !modalImg) return;
    modalImg.src = src;
    modalImg.alt = '文章图片预览';
    modal.classList.remove('closing');
    // 强制重排让入场动画在连续点击时也能重放
    void modal.offsetWidth;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
};

const closeModal = () => {
    if (!modal || !modal.classList.contains('open') || modal.classList.contains('closing')) return;
    closePressed?.classList.remove('flashing');
    void closePressed?.offsetWidth;
    closePressed?.classList.add('flashing');
    modal.classList.add('closing');
    window.setTimeout(() => {
        modal.classList.remove('open', 'closing');
        modal.setAttribute('aria-hidden', 'true');
        closePressed?.classList.remove('flashing');
        if (modalImg) modalImg.src = '';
    }, 230);
};

// markdown 由构建期渲染，这里用事件委托接管所有正文图片点击
document.querySelector('.markdown-body')?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const img = target.closest('img');
    if (!img) return;
    const src = (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src;
    if (src) openModal(src);
});

closeButton?.addEventListener('click', closeModal);

// 点击斜纹遮罩空白处关闭
modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
});

// Esc 关闭
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
});
// ===== 图片放大预览 end =====

// ===== 代码块复制按钮 start =====
document.querySelectorAll<HTMLElement>('.markdown-body pre').forEach((pre) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy-btn';
    button.textContent = '复制';
    button.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.textContent ?? '';
        try {
            await navigator.clipboard.writeText(code);
            button.textContent = '已复制';
            button.classList.add('copied');
        } catch {
            button.textContent = '复制失败';
        }
        window.setTimeout(() => {
            button.textContent = '复制';
            button.classList.remove('copied');
        }, 1500);
    });
    pre.appendChild(button);
});
// ===== 代码块复制按钮 end =====
