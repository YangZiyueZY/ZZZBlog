import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * 关于页「快速手册」：分组/栏目/卡片切换、键盘左右、友链前往。
 * 逻辑与重构前的 about-book.ts 一致。
 */
export function useAboutBook(root: Ref<HTMLElement | undefined>) {
  const cleanups: Array<() => void> = []

  onMounted(() => {
    const el = root.value
    if (!el) return

    const groupTabs = Array.from(el.querySelectorAll<HTMLElement>('[data-role="group-tab"]'))
    const columnTabs = Array.from(el.querySelectorAll<HTMLElement>('[data-role="column-tab"]'))
    const panels = Array.from(el.querySelectorAll<HTMLElement>('[data-role="column-panel"]'))

    let activeGroup = 0
    let activeColumn = 0
    let activeCard = 0

    const getActivePanel = () =>
      panels.find(
        (panel) => Number(panel.dataset.group) === activeGroup && Number(panel.dataset.column) === activeColumn,
      )

    const sync = () => {
      groupTabs.forEach((tab) => tab.classList.toggle('active', Number(tab.dataset.group) === activeGroup))

      columnTabs.forEach((tab) => {
        const isCurrentGroup = Number(tab.dataset.group) === activeGroup
        tab.classList.toggle('hidden', !isCurrentGroup)
        tab.classList.toggle('active', isCurrentGroup && Number(tab.dataset.column) === activeColumn)
      })

      panels.forEach((panel) => {
        const visible =
          Number(panel.dataset.group) === activeGroup && Number(panel.dataset.column) === activeColumn
        panel.classList.toggle('hidden', !visible)
      })

      const panel = getActivePanel()
      if (!panel) return

      const cards = Array.from(panel.querySelectorAll<HTMLElement>('[data-role="card"]'))
      const details = Array.from(panel.querySelectorAll<HTMLElement>('[data-role="card-detail"]'))
      cards.forEach((card, index) => card.classList.toggle('active', index === activeCard))
      details.forEach((detail, index) => detail.classList.toggle('hidden', index !== activeCard))
    }

    groupTabs.forEach((tab) => {
      const handler = () => {
        activeGroup = Number(tab.dataset.group)
        const firstPanel = panels.find((panel) => Number(panel.dataset.group) === activeGroup)
        const columnCount = panels.filter((panel) => Number(panel.dataset.group) === activeGroup).length
        if (activeColumn >= columnCount) activeColumn = 0
        activeCard = 0
        void firstPanel
        sync()
      }
      tab.addEventListener('click', handler)
      cleanups.push(() => tab.removeEventListener('click', handler))
    })

    columnTabs.forEach((tab) => {
      const handler = () => {
        activeColumn = Number(tab.dataset.column)
        activeCard = 0
        sync()
      }
      tab.addEventListener('click', handler)
      cleanups.push(() => tab.removeEventListener('click', handler))
    })

    const onRootClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const goButton = target.closest<HTMLElement>('[data-url]')
      if (goButton?.dataset.url) {
        window.open(goButton.dataset.url, '_blank', 'noopener,noreferrer')
        return
      }
      const card = target.closest<HTMLElement>('[data-role="card"]')
      if (card) {
        const panel = card.closest<HTMLElement>('[data-role="column-panel"]')
        const cards = panel ? Array.from(panel.querySelectorAll('[data-role="card"]')) : []
        const index = cards.indexOf(card)
        if (index >= 0) {
          activeCard = index
          sync()
        }
      }
    }
    el.addEventListener('click', onRootClick)
    cleanups.push(() => el.removeEventListener('click', onRootClick))

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const panel = getActivePanel()
      if (!panel) return
      const length = panel.querySelectorAll('[data-role="card"]').length
      if (!length) return
      if (event.key === 'ArrowRight') activeCard = (activeCard + 1 + length) % length
      else activeCard = (activeCard - 1 + length) % length
      event.preventDefault()
      sync()
    }
    document.addEventListener('keydown', onKeydown)
    cleanups.push(() => document.removeEventListener('keydown', onKeydown))

    sync()
  })

  onBeforeUnmount(() => {
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  })
}
