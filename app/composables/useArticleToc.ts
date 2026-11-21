import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * 文章目录：桌面双面板滚动、点击跳转、滚动高亮、移动端浮层、设备切换复位。
 * 逻辑与重构前的 article-toc.ts 一致。
 */
export function useArticleToc(root: Ref<HTMLElement | undefined>) {
  const cleanups: Array<() => void> = []

  onMounted(() => {
    const el = root.value
    if (!el) return
    const toc = el.querySelector<HTMLElement>('[data-role="article-toc"]')
    const article = el.querySelector<HTMLElement>('[data-role="article-scroll"]')
    if (!toc || !article) return

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
    const desktop = window.matchMedia('(min-width: 768px)')
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
        if (id) setActive(id)
        const paddingTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0
        if (desktop.matches) {
          const top =
            target.getBoundingClientRect().top -
            article.getBoundingClientRect().top +
            article.scrollTop -
            paddingTop
          article.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' })
        } else {
          const top = target.getBoundingClientRect().top + window.scrollY - paddingTop
          window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' })
        }
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
        { root: article, rootMargin: '-16px 0px -70% 0px' },
      )
      headings.forEach((heading) => observer!.observe(heading))
    }

    const desktopQuery = window.matchMedia('(min-width: 768px)')
    const forceResetPageScroll = () => {
      if (!desktopQuery.matches) return
      window.scrollTo({ top: 0, behavior: 'auto' })
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }))
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 60)
    }
    desktopQuery.addEventListener('change', forceResetPageScroll)
    window.addEventListener('resize', forceResetPageScroll)
    cleanups.push(() => {
      observer?.disconnect()
      desktopQuery.removeEventListener('change', forceResetPageScroll)
      window.removeEventListener('resize', forceResetPageScroll)
    })

    setActive(headings[0].id)
  })

  onBeforeUnmount(() => {
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  })
}