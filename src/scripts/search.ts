/**
 * 站内搜索：索引由 AppHeader 以 #search-index（application/json）注入，
 * 这里对标题/正文做即时过滤，支持方向键选择、回车跳转、点击外部关闭。
 */
interface SearchDoc {
    id: number;
    title: string;
    url: string;
    desc: string;
    text: string;
}

function initSearch(): void {
    const indexScript = document.getElementById('search-index') as HTMLScriptElement | null;
    if (!indexScript) return;
    let index: SearchDoc[] = [];
    try {
        index = JSON.parse(indexScript.textContent ?? '[]') as SearchDoc[];
    } catch {
        return;
    }

    const escapeHtml = (s: string): string =>
        s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

    // 截取命中位置附近的正文片段，并高亮命中的关键词
    const highlight = (source: string, query: string): string => {
        const lower = source.toLowerCase();
        const q = query.toLowerCase();
        const hit = lower.indexOf(q);
        if (hit < 0) return escapeHtml(source.slice(0, 140));
        const start = Math.max(0, hit - 40);
        const end = Math.min(source.length, start + 180);
        const relHit = start === 0 ? hit : hit - start;
        return (
            (start > 0 ? '…' : '') +
            escapeHtml(source.slice(start, start + relHit)) +
            '<mark>' + escapeHtml(source.slice(start + relHit, start + relHit + q.length)) + '</mark>' +
            escapeHtml(source.slice(start + relHit + q.length, end)) +
            (end < source.length ? '…' : '')
        );
    };

    document.querySelectorAll<HTMLElement>('.search-box').forEach((box) => {
        const input = box.querySelector<HTMLInputElement>('.search-input');
        const results = box.querySelector<HTMLElement>('[data-search-results]');
        if (!input || !results || box.dataset.searchInit) return;
        box.dataset.searchInit = '1';

        let open = false;

        const render = (): void => {
            const query = input.value.trim();
            if (!query) {
                results.classList.remove('open');
                open = false;
                return;
            }
            const q = query.toLowerCase();
            const hits = index
                .filter((doc) => doc.title.toLowerCase().includes(q) || doc.text.toLowerCase().includes(q))
                .slice(0, 8);
            if (hits.length === 0) {
                results.innerHTML = '<div class="search-empty">未找到相关文章</div>';
                results.classList.add('open');
                open = true;
                return;
            }
            results.innerHTML = hits
                .map(
                    (doc) =>
                        `<a class="search-result" href="${doc.url}">
                            <span class="search-result-title">${escapeHtml(doc.title)}</span>
                            <span class="search-result-snippet">${highlight(doc.text, query)}</span>
                        </a>`
                )
                .join('');
            results.classList.add('open');
            open = true;
        };

        const goto = (a: HTMLAnchorElement | null): void => {
            const href = a?.getAttribute('href');
            if (href) window.location.href = href;
        };

        const close = (): void => {
            results.classList.remove('open');
            open = false;
        };

        input.addEventListener('input', render);
        input.addEventListener('focus', () => {
            if (input.value.trim()) render();
        });

        results.addEventListener('click', (ev) => {
            const target = (ev.target as HTMLElement).closest<HTMLAnchorElement>('.search-result');
            goto(target);
        });

        input.addEventListener('keydown', (ev) => {
            const items = Array.from(results.querySelectorAll<HTMLAnchorElement>('.search-result'));
            if (ev.key === 'Enter') {
                const current = items.find((el) => el.classList.contains('selected')) ?? items[0];
                goto(current ?? null);
            } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
                ev.preventDefault();
                if (items.length === 0) return;
                const dir = ev.key === 'ArrowDown' ? 1 : -1;
                const cur = items.findIndex((el) => el.classList.contains('selected'));
                const next = (cur + dir + items.length) % items.length;
                items.forEach((el, i) => el.classList.toggle('selected', i === next));
                items[next].scrollIntoView({ block: 'nearest' });
            } else if (ev.key === 'Escape') {
                close();
            }
        });

        document.addEventListener('click', (ev) => {
            if (open && !box.contains(ev.target as Node)) close();
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch, { once: true });
} else {
    initSearch();
}
