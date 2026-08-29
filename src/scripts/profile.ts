/**
 * 个人主页（绝区零风格）交互：
 * - 「个人主页 / 绳匠档案」页签切换
 * - UID 一键复制
 * - 当前权益列表上/下滚动箭头
 * 页面内容全部构建期渲染，这里只做轻交互。注意：原生 ESM 下严禁顶层 return。
 */
function initProfile(): void {
    // 返回键：与文章详情页同款（按压闪烁 0.3s 后返回上一页）
    const backButton = document.querySelector<HTMLElement>('.back-button');
    const backPressed = document.querySelector<HTMLElement>('.back-button_pressed');
    backButton?.addEventListener('click', () => {
        if (backPressed?.classList.contains('flashing')) return;
        backPressed?.classList.add('flashing');
        window.setTimeout(() => window.history.back(), 300);
    });

    // 页签切换
    const tabs = Array.from(document.querySelectorAll<HTMLElement>('[data-role="profile-tab"]'));
    const views = Array.from(document.querySelectorAll<HTMLElement>('[data-role="profile-view"]'));

    const switchTo = (name: string) => {
        tabs.forEach((tab) => {
            const active = tab.dataset.view === name;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        views.forEach((view) => {
            view.classList.toggle('hidden', view.dataset.view !== name);
        });
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => switchTo(tab.dataset.view ?? 'home'));
    });

    // UID 复制
    const uidButton = document.querySelector<HTMLElement>('[data-role="uid-copy"]');
    uidButton?.addEventListener('click', () => {
        const text = uidButton.textContent?.replace(/^UID:\s*/, '').trim() ?? '';
        const write = navigator.clipboard?.writeText(text);
        if (!write) return;
        write.then(() => {
            const label = uidButton.querySelector('span');
            if (!label || uidButton.dataset.copied === '1') return;
            const original = label.textContent;
            uidButton.dataset.copied = '1';
            label.textContent = '已复制';
            window.setTimeout(() => {
                label.textContent = original;
                delete uidButton.dataset.copied;
            }, 1200);
        });
    });

    // 当前权益列表滚动
    const list = document.querySelector<HTMLElement>('[data-role="benefit-list"]');
    const step = 150;
    document.querySelector('[data-role="benefit-up"]')?.addEventListener('click', () => {
        list?.scrollBy({ top: -step, behavior: 'smooth' });
    });
    document.querySelector('[data-role="benefit-down"]')?.addEventListener('click', () => {
        list?.scrollBy({ top: step, behavior: 'smooth' });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfile, { once: true });
} else {
    initProfile();
}
