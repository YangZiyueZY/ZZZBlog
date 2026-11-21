import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * 文章目录：窗口滚动、点击跳转、滚动高亮、移动端底部抽屉。
 * 新版页面是正常文档流，因此不再使用内部滚动容器。
 */
export function useArticleToc(root: Ref<HTMLElement | undefined>) {
  const cleanups: Array<() => void> = []

  onMounted(() => {
    const el = root.value
    if (!el) return
    const toc = el.querySelector<HTMLElement>('[data-role="article-toc"]')
    if (!toc) return

    const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>('.article-toc__link'))
    const headings: HTMLElement[] = []
    for (const link of links) {
      const id = link.getAttribute('href')?.slice(1)
      const heading = id ? document.getElementById(id) : null
      if (heading) headings.push(heading)
    }
    if (!headings.length) return

    const setActive = (id: string | null) => {
      links.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${id}`
        link.classList.toggle('is-active', isActive)
        if (isActive) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      })
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fab = el.querySelector<HTMLButtonElement>('.toc-fab')
    const setSheet = (open: boolean) => {
      toc.classList.toggle('article-toc--sheet-open', open)
      fab?.setAttribute('aria-expanded', String(open))
      fab?.setAttribute('aria-label', open ? '关闭文章目录' : '打开文章目录')
    }

    links.forEach((link) => {
      const handler = (event: Event) => {
        event.preventDefault()
        setSheet(false)
        const id = link.getAttribute('href')?.slice(1)
        const target = id ? document.getElementById(id) : null
        if (!target) return
        if (id) {
          setActive(id)
          history.replaceState(null, '', `#${id}`)
        }
        const headerOffset = 96
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset
        window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' })
      }
      link.addEventListener('click', handler)
      cleanups.push(() => link.removeEventListener('click', handler))
    })

    const onFabClick = () => setSheet(!toc.classList.contains('article-toc--sheet-open'))
    fab?.addEventListener('click', onFabClick)
    cleanups.push(() => fab?.removeEventListener('click', onFabClick))

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheet(false)
    }
    const onDocumentClick = (event: MouseEvent) => {
      if (!toc.classList.contains('article-toc--sheet-open')) return
      const node = event.target as Node
      if (toc.contains(node) || fab?.contains(node)) return
      setSheet(false)
    }
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('click', onDocumentClick)
    cleanups.push(() => {
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('click', onDocumentClick)
    })

    let observer: IntersectionObserver | undefined
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          if (visible[0]) setActive(visible[0].target.id)
        },
        { root: null, rootMargin: '-96px 0px -65% 0px' },
      )
      headings.forEach((heading) => observer!.observe(heading))
    }

    setActive(headings[0].id)
    cleanups.push(() => observer?.disconnect())
  })

  onBeforeUnmount(() => {
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  })
}
