import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { copyText } from '../lib/clipboard'

/**
 * 个人主页交互：个人主页/绳匠档案页签、UID 复制、更多菜单、分享复制、权益滚动。
 * 逻辑与重构前的 profile.ts 一致，改为在组件挂载后绑定。
 */
export function useProfilePage(root: Ref<HTMLElement | undefined>) {
  const cleanups: Array<() => void> = []

  onMounted(() => {
    const el = root.value
    if (!el) return

    const tabs = Array.from(el.querySelectorAll<HTMLElement>('[data-role="profile-tab"]'))
    const views = Array.from(el.querySelectorAll<HTMLElement>('[data-role="profile-view"]'))

    const switchTo = (name: string) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.view === name
        tab.classList.toggle('active', active)
        tab.setAttribute('aria-selected', String(active))
      })
      views.forEach((view) => {
        view.classList.toggle('hidden', view.dataset.view !== name)
      })
    }

    tabs.forEach((tab) => {
      const handler = () => switchTo(tab.dataset.view ?? 'home')
      tab.addEventListener('click', handler)
      cleanups.push(() => tab.removeEventListener('click', handler))
    })

    const uidButton = el.querySelector<HTMLElement>('[data-role="uid-copy"]')
    if (uidButton) {
      const handler = () => {
        const text = uidButton.textContent?.replace(/^UID:\s*/, '').trim() ?? ''
        void copyText(text).then((ok) => {
          if (!ok) return
          const label = uidButton.querySelector('span')
          if (!label || uidButton.dataset.copied === '1') return
          const original = label.textContent
          uidButton.dataset.copied = '1'
          label.textContent = '已复制'
          window.setTimeout(() => {
            label.textContent = original
            delete uidButton.dataset.copied
          }, 1200)
        })
      }
      uidButton.addEventListener('click', handler)
      cleanups.push(() => uidButton.removeEventListener('click', handler))
    }

    const moreToggle = el.querySelector<HTMLElement>('[data-role="more-toggle"]')
    const moreMenu = el.querySelector<HTMLElement>('#profile-more-menu')
    const setMoreMenu = (open: boolean) => {
      moreMenu?.classList.toggle('open', open)
      moreToggle?.setAttribute('aria-expanded', String(open))
    }
    if (moreToggle) {
      const handler = () => setMoreMenu(!moreMenu?.classList.contains('open'))
      moreToggle.addEventListener('click', handler)
      cleanups.push(() => moreToggle.removeEventListener('click', handler))
    }

    const onDocumentClick = (event: MouseEvent) => {
      if (!moreMenu?.classList.contains('open')) return
      const node = event.target as Node
      if (moreMenu.contains(node) || moreToggle?.contains(node)) return
      setMoreMenu(false)
    }
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreMenu(false)
    }
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onKeydown)
    cleanups.push(() => {
      document.removeEventListener('click', onDocumentClick)
      document.removeEventListener('keydown', onKeydown)
    })

    const shareCopy = el.querySelector<HTMLButtonElement>('[data-role="share-copy"]')
    if (shareCopy) {
      const handler = async () => {
        const original = '复制本页链接'
        try {
          const ok = await copyText(window.location.href)
          if (!ok) throw new Error('copy failed')
          shareCopy.textContent = '已复制'
          window.setTimeout(() => {
            shareCopy.textContent = original
            setMoreMenu(false)
          }, 900)
        } catch {
          shareCopy.textContent = '复制失败'
          window.setTimeout(() => {
            shareCopy.textContent = original
          }, 1200)
        }
      }
      shareCopy.addEventListener('click', handler)
      cleanups.push(() => shareCopy.removeEventListener('click', handler))
    }

    const list = el.querySelector<HTMLElement>('[data-role="benefit-list"]')
    const step = 150
    const up = el.querySelector<HTMLElement>('[data-role="benefit-up"]')
    const down = el.querySelector<HTMLElement>('[data-role="benefit-down"]')
    const scrollUp = () => list?.scrollBy({ top: -step, behavior: 'smooth' })
    const scrollDown = () => list?.scrollBy({ top: step, behavior: 'smooth' })
    up?.addEventListener('click', scrollUp)
    down?.addEventListener('click', scrollDown)
    cleanups.push(() => {
      up?.removeEventListener('click', scrollUp)
      down?.removeEventListener('click', scrollDown)
    })
  })

  onBeforeUnmount(() => {
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  })
}