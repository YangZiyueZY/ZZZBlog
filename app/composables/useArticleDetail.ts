import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { copyText } from '../lib/clipboard'

/**
 * 文章详情交互：页脚滑入、图片放大、代码复制。
 * 返回按钮由 useBackButton 单独处理。
 */
export function useArticleDetail(root: Ref<HTMLElement | undefined>) {
  const cleanups: Array<() => void> = []

  onMounted(() => {
    const el = root.value
    if (!el) return

    const scroller = el.querySelector<HTMLElement>('[data-role="article-scroll"]')
    const footer = document.querySelector<HTMLElement>('footer.footer-auto-reveal')

    // ===== 页脚滑入 =====
    if (scroller && footer) {
      const updateFooter = () => {
        const nearBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 8
        footer.classList.toggle('is-revealed', nearBottom)
      }
      scroller.addEventListener('scroll', updateFooter, { passive: true })
      window.addEventListener('resize', updateFooter)
      let observer: ResizeObserver | undefined
      const markdown = scroller.querySelector('.markdown-body')
      if (markdown && 'ResizeObserver' in window) {
        observer = new ResizeObserver(updateFooter)
        observer.observe(markdown)
      }
      updateFooter()
      cleanups.push(() => {
        scroller.removeEventListener('scroll', updateFooter)
        window.removeEventListener('resize', updateFooter)
        observer?.disconnect()
      })
    }

    // ===== 图片放大 =====
    const modal = el.querySelector<HTMLElement>('#image-modal')
    const modalImg = el.querySelector<HTMLImageElement>('#modal-image')
    const closeButton = el.querySelector<HTMLElement>('.image-modal .close-button')
    const closePressed = el.querySelector<HTMLElement>('.image-modal .close-button_pressed')

    const openModal = (src: string) => {
      if (!modal || !modalImg) return
      modalImg.src = src
      modalImg.alt = '文章图片预览'
      modal.classList.remove('closing')
      void modal.offsetWidth
      modal.classList.add('open')
      modal.setAttribute('aria-hidden', 'false')
    }

    const closeModal = () => {
      if (!modal || !modal.classList.contains('open') || modal.classList.contains('closing')) return
      closePressed?.classList.remove('flashing')
      void closePressed?.offsetWidth
      closePressed?.classList.add('flashing')
      modal.classList.add('closing')
      window.setTimeout(() => {
        modal.classList.remove('open', 'closing')
        modal.setAttribute('aria-hidden', 'true')
        closePressed?.classList.remove('flashing')
        if (modalImg) modalImg.src = ''
      }, 230)
    }

    const markdownBody = el.querySelector<HTMLElement>('.markdown-body')
    const onImageClick = (event: MouseEvent) => {
      const img = (event.target as HTMLElement).closest('img')
      if (!img) return
      const src = (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src
      if (src) openModal(src)
    }
    markdownBody?.addEventListener('click', onImageClick)
    closeButton?.addEventListener('click', closeModal)
    const onModalClick = (event: MouseEvent) => {
      if (event.target === modal) closeModal()
    }
    modal?.addEventListener('click', onModalClick)
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeydown)
    cleanups.push(() => {
      markdownBody?.removeEventListener('click', onImageClick)
      closeButton?.removeEventListener('click', closeModal)
      modal?.removeEventListener('click', onModalClick)
      document.removeEventListener('keydown', onKeydown)
    })

    // ===== 代码复制 =====
    markdownBody?.querySelectorAll<HTMLElement>('pre').forEach((pre) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'code-copy-btn'
      button.textContent = '复制'
      const handler = async () => {
        const code = pre.querySelector('code')?.textContent ?? ''
        try {
          const ok = await copyText(code)
          if (!ok) throw new Error('copy failed')
          button.textContent = '已复制'
          button.classList.add('copied')
        } catch {
          button.textContent = '复制失败'
        }
        window.setTimeout(() => {
          button.textContent = '复制'
          button.classList.remove('copied')
        }, 1500)
      }
      button.addEventListener('click', handler)
      pre.appendChild(button)
    })
  })

  onBeforeUnmount(() => {
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  })
}