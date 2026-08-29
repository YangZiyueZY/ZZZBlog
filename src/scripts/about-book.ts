/**
 * 关于页「快速手册」交互（原 Vue 组件状态 → 原生 TS）：
 * - 顶部页签切换分组（关于我 / Github）
 * - 左栏切换栏目
 * - 卡片点选 + 桌面端键盘左右切换
 * - Github 列表「前往」按钮新开仓库页
 * 所有面板均在构建期渲染为静态 HTML，这里只做显隐切换。
 */

const root = document.getElementById('about-book');
if (root) {
    const groupTabs = Array.from(root.querySelectorAll<HTMLElement>('[data-role="group-tab"]'));
    const columnTabs = Array.from(root.querySelectorAll<HTMLElement>('[data-role="column-tab"]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-role="column-panel"]'));

    let activeGroup = 0;
    let activeColumn = 0;
    let activeCard = 0;

    const getActivePanel = () =>
        panels.find(
            (panel) =>
                Number(panel.dataset.group) === activeGroup && Number(panel.dataset.column) === activeColumn,
        );

    const sync = () => {
        groupTabs.forEach((tab) => tab.classList.toggle('active', Number(tab.dataset.group) === activeGroup));

        // 左栏只显示当前分组的栏目
        columnTabs.forEach((tab) => {
            const isCurrentGroup = Number(tab.dataset.group) === activeGroup;
            tab.classList.toggle('hidden', !isCurrentGroup);
            tab.classList.toggle('active', isCurrentGroup && Number(tab.dataset.column) === activeColumn);
        });

        panels.forEach((panel) => {
            const visible =
                Number(panel.dataset.group) === activeGroup && Number(panel.dataset.column) === activeColumn;
            panel.classList.toggle('hidden', !visible);
        });

        const panel = getActivePanel();
        if (!panel) return;

        const cards = Array.from(panel.querySelectorAll<HTMLElement>('[data-role="card"]'));
        const details = Array.from(panel.querySelectorAll<HTMLElement>('[data-role="card-detail"]'));
        cards.forEach((card, index) => card.classList.toggle('active', index === activeCard));
        details.forEach((detail, index) => detail.classList.toggle('hidden', index !== activeCard));
    };

    // 分组切换（保持原版行为：栏目索引延续，不重置）
    groupTabs.forEach((tab) =>
        tab.addEventListener('click', () => {
            activeGroup = Number(tab.dataset.group);
            activeCard = 0;
            sync();
        }),
    );

    // 栏目切换后重置卡片索引（等价原 watch）
    columnTabs.forEach((tab) =>
        tab.addEventListener('click', () => {
            activeColumn = Number(tab.dataset.column);
            activeCard = 0;
            sync();
        }),
    );

    // 卡片点选 + Github「前往」
    root.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        const goButton = target.closest<HTMLElement>('[data-url]');
        if (goButton?.dataset.url) {
            window.open(goButton.dataset.url, '_blank', 'noopener,noreferrer');
            return;
        }

        const card = target.closest<HTMLElement>('[data-role="card"]');
        if (card) {
            const panel = card.closest<HTMLElement>('[data-role="column-panel"]');
            const cards = panel ? Array.from(panel.querySelectorAll('[data-role="card"]')) : [];
            const index = cards.indexOf(card);
            if (index >= 0) {
                activeCard = index;
                sync();
            }
        }
    });

    // 桌面端键盘左右切换（仅「关于我」卡片视图；只拦截方向键，不再全局 preventDefault）
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        const panel = getActivePanel();
        if (!panel || panel.dataset.groupTitle !== '关于我') return;

        const length = panel.querySelectorAll('[data-role="card"]').length;
        if (!length) return;

        if (event.key === 'ArrowRight') {
            activeCard = (activeCard + 1 + length) % length;
        } else {
            activeCard = (activeCard - 1 + length) % length;
        }
        event.preventDefault();
        sync();
    });

    sync();
}
