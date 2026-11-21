import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 文章阅读进度：按文档滚动高度计算 0-100，rAF 节流。
 * 顶部进度条、目录百分比与移动端 FAB 共用。
 */
export function useArticleProgress() {
  const progress = ref(0)
  let raf = 0

  const update = () => {
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    progress.value = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0
  }

  const onScroll = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      update()
    })
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', update)
    if (raf) cancelAnimationFrame(raf)
  })

  return { progress }
}
