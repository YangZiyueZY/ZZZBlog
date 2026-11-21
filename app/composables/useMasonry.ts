import { nextTick, onMounted, type Ref } from 'vue'

const ROW_HEIGHT = 20

/**
 * 瀑布流：图片加载完成后按卡片高度计算 grid-row span。
 * 逻辑与 src/scripts/masonry.ts 一致：只处理当前卡片、失败重试 2 次、IO 兜底 eager。
 */
export function useMasonry(gridRef: Ref<HTMLElement | undefined>) {
  const applySpan = (card: HTMLElement) => {
    card.style.gridRowEnd = `span ${Math.ceil(card.clientHeight / ROW_HEIGHT) + 1}`
  }

  const init = () => {
    const grid = gridRef.value
    if (!grid) return
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
    init()
  })
}