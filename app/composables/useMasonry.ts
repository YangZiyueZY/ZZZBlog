import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue'

const DEFAULT_ROW_HEIGHT = 20

/**
 * 瀑布流：按卡片实际高度计算 grid-row span。
 *
 * 列数由 CSS 的 auto-fill + minmax 随容器宽度自适应（见 components.less 的 .article-grid），
 * 因此视口宽度变化会同时改变列数、卡片宽度和卡片高度。若只在挂载时算一次 span，
 * 跨过列数变化后卡片就会重叠或留白，所以这里用 ResizeObserver 盯住网格宽度：
 * 宽度一变就重算全部 span，只改 span 引起的网格高度变化会被忽略，避免自触发循环。
 * 图片加载完成、字体加载完成后也会补算一次。
 */
export function useMasonry(gridRef: Ref<HTMLElement | undefined>) {
  let resizeObserver: ResizeObserver | null = null
  let frame = 0
  let lastWidth = -1
  let rowHeight = DEFAULT_ROW_HEIGHT

  const applySpan = (card: HTMLElement) => {
    card.style.gridRowEnd = `span ${Math.ceil(card.clientHeight / rowHeight) + 1}`
  }

  const relayout = () => {
    const grid = gridRef.value
    if (!grid) return
    grid.querySelectorAll<HTMLElement>('[data-masonry-item]').forEach(applySpan)
  }

  /** 合并同一帧内的多次重算，避免图片成批加载时反复读写布局 */
  const scheduleRelayout = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      relayout()
    })
  }

  const init = (grid: HTMLElement) => {
    grid.querySelectorAll<HTMLElement>('[data-masonry-item]').forEach((card) => {
      const cover = card.querySelector<HTMLElement>('.card-cover')
      const img = card.querySelector('img')
      if (!img) return

      let retries = 0
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        cover?.classList.add('loaded')
        applySpan(card)
        // 封面缺少 width/height 时，图片加载完成会改变卡片高度
        scheduleRelayout()
      }
      const onLoad = () => {
        if (img.complete && img.naturalWidth === 0) {
          onError()
          return
        }
        done()
      }
      const onError = () => {
        if (settled) return
        if (retries >= 2) {
          done()
          return
        }
        retries += 1
        img.src = retries === 1 ? img.src : `${img.src}${img.src.includes('?') ? '&' : '?'}masonry-retry=${retries}`
        listen()
      }
      const listen = () => {
        if (img.complete) {
          onLoad()
          return
        }
        img.addEventListener('load', onLoad, { once: true })
        img.addEventListener('error', onError, { once: true })
      }
      listen()

      if ('IntersectionObserver' in window && img.loading === 'lazy') {
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting && !img.complete && img.loading === 'lazy') img.loading = 'eager'
              if (img.complete) io.disconnect()
            }
          },
          { rootMargin: '200px' },
        )
        io.observe(card)
      }
    })
  }

  onMounted(async () => {
    await nextTick()
    const grid = gridRef.value
    if (!grid) return

    // 行高单位取实际 row-gap：span 里的 +1 行正好留出卡片间距
    const gap = Number.parseFloat(getComputedStyle(grid).rowGap)
    if (Number.isFinite(gap) && gap > 0) rowHeight = gap

    init(grid)
    relayout()

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 0
        // 只关心宽度（列数/卡片宽度）变化，忽略高度变化
        if (Math.abs(width - lastWidth) < 1) return
        lastWidth = width
        scheduleRelayout()
      })
      resizeObserver.observe(grid)
    }

    await document.fonts?.ready
    scheduleRelayout()
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  })
}
