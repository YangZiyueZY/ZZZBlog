import { computed, nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { withBase } from '../../src/config/site'

interface SearchDoc {
  id: number
  title: string
  url: string
  desc: string
  text: string
}

let indexPromise: Promise<SearchDoc[]> | null = null
function loadIndex(): Promise<SearchDoc[]> {
  if (!indexPromise) {
    indexPromise = import('../../.content/search-index.json').then(
      (module) => ((module as { default?: SearchDoc[] }).default ?? module) as unknown as SearchDoc[],
    )
  }
  return indexPromise
}

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

const highlight = (source: string, query: string): string => {
  const lower = source.toLowerCase()
  const q = query.toLowerCase()
  const hit = lower.indexOf(q)
  if (hit < 0) return escapeHtml(source.slice(0, 140))
  const start = Math.max(0, hit - 40)
  const end = Math.min(source.length, start + 180)
  const relHit = start === 0 ? hit : hit - start
  return (
    (start > 0 ? '…' : '') +
    escapeHtml(source.slice(start, start + relHit)) +
    '<mark>' + escapeHtml(source.slice(start + relHit, start + relHit + q.length)) + '</mark>' +
    escapeHtml(source.slice(start + relHit + q.length, end)) +
    (end < source.length ? '…' : '')
  )
}

export function useSearch(root: Ref<HTMLElement | undefined>) {
  const router = useRouter()
  const query = ref('')
  const open = ref(false)
  const selected = ref(0)
  const docs = ref<SearchDoc[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const resultsEl = ref<HTMLElement>()

  const hits = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return []
    return docs.value.filter((doc) => doc.title.toLowerCase().includes(q) || doc.text.toLowerCase().includes(q)).slice(0, 8)
  })

  const openResults = computed(() => open.value && query.value.trim().length > 0)

  const ensureIndex = async () => {
    if (loaded.value || loading.value) return
    loading.value = true
    try {
      docs.value = await loadIndex()
    } finally {
      loading.value = false
      loaded.value = true
    }
  }

  const render = () => {
    if (!query.value.trim()) {
      open.value = false
      return
    }
    open.value = true
    selected.value = 0
    void ensureIndex()
  }

  const onInput = () => render()
  const onFocus = () => {
    if (query.value.trim()) render()
  }

  const go = (doc: SearchDoc) => {
    open.value = false
    query.value = ''
    void router.push(doc.url)
  }

  const scrollSelected = () => {
    nextTick(() => {
      const items = resultsEl.value?.querySelectorAll<HTMLAnchorElement>('.search-result')
      items?.[selected.value]?.scrollIntoView({ block: 'nearest' })
    })
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (!openResults.value) return
    if (event.key === 'Enter') {
      event.preventDefault()
      const doc = hits.value[selected.value] ?? hits.value[0]
      if (doc) go(doc)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!hits.value.length) return
      event.preventDefault()
      const dir = event.key === 'ArrowDown' ? 1 : -1
      selected.value = (selected.value + dir + hits.value.length) % hits.value.length
      scrollSelected()
    } else if (event.key === 'Escape') {
      open.value = false
    }
  }

  const onDocumentClick = (event: MouseEvent) => {
    if (!open.value) return
    const node = event.target as Node
    if (root.value?.contains(node)) return
    open.value = false
  }

  onMounted(() => {
    document.addEventListener('click', onDocumentClick)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick)
  })

  return {
    query,
    openResults,
    hits,
    selected,
    loaded,
    loading,
    resultsEl,
    onInput,
    onFocus,
    onKeydown,
    go,
    highlight,
    withBase,
  }
}
