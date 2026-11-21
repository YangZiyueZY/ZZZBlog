import type { Ref } from 'vue'

/**
 * 返回按钮：按压闪烁 0.3s 后 history.back()。
 * 与 src/scripts/article-detail.ts / profile.ts 的原实现一致。
 */
export function useBackButton(pressed: Ref<HTMLElement | undefined>) {
  const onBack = () => {
    const el = pressed.value
    if (!el || el.classList.contains('flashing')) return
    el.classList.add('flashing')
    window.setTimeout(() => {
      window.history.back()
    }, 300)
  }

  return { onBack }
}
