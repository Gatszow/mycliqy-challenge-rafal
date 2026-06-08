'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { QueueItem, MessageStatus, MessageCategory } from '@/types'
import { CATEGORIES } from '@/lib/ui'
import { computeStats, sortForTriage } from '@/lib/queue'
import { StatsBar } from '@/components/StatsBar'
import { AddMessageForm } from '@/components/AddMessageForm'
import { QueueCard } from '@/components/QueueCard'
import { Toast } from '@/components/Toast'

const SEED_ITEMS: QueueItem[] = [
  {
    id: '1',
    message: 'Dzień dobry, chciałbym zamówić 50 sztuk produktu X. Czy możliwy jest rabat przy takiej ilości?',
    company: 'Sklep meblowy Premium',
    category: 'zamówienie',
    priority: 'high',
    draft_reply:
      'Dzień dobry! Dziękujemy za zainteresowanie naszą ofertą. Przy zamówieniu 50 sztuk produktu X przysługuje rabat 15%. Czy mogę poprosić o dane do wyceny?',
    confidence: 0.94,
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    message: 'Kiedy przyjedzie moja paczka? Zamówiłam tydzień temu i nic.',
    company: 'Sklep meblowy Premium',
    category: 'reklamacja',
    priority: 'high',
    draft_reply:
      'Przepraszamy za niedogodności. Proszę o numer zamówienia — sprawdzimy status wysyłki i wrócimy do Pani w ciągu 2 godzin.',
    confidence: 0.62,
    status: 'pending',
    created_at: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: '3',
    message: 'Jakie są godziny otwarcia w weekend?',
    company: 'Sklep meblowy Premium',
    category: 'pytanie',
    priority: 'low',
    draft_reply: 'Jesteśmy otwarci w soboty w godz. 10:00–18:00. W niedziele sklep jest nieczynny.',
    confidence: 0.98,
    status: 'pending',
    created_at: new Date(Date.now() - 300_000).toISOString(),
  },
]

interface LastAction {
  id: string
  prevStatus: MessageStatus
}

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>(SEED_ITEMS)
  const [filter, setFilter] = useState<MessageCategory | 'all'>('all')
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set())
  const [lastAction, setLastAction] = useState<LastAction | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const visible = useMemo(
    () => sortForTriage(filter === 'all' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  )
  const visiblePending = useMemo(() => visible.filter((i) => i.status === 'pending'), [visible])
  const stats = useMemo(() => computeStats(items, editedIds), [items, editedIds])

  // Focus zawsze wskazuje widoczny pending — przelicz gdy filtr/akcja go usunie.
  useEffect(() => {
    if (visiblePending.length === 0) {
      if (focusedId !== null) setFocusedId(null)
      return
    }
    if (!visiblePending.some((i) => i.id === focusedId)) {
      setFocusedId(visiblePending[0].id)
    }
  }, [visiblePending, focusedId])

  const clearToastTimer = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = null
  }, [])

  const showToast = useCallback(
    (message: string) => {
      clearToastTimer()
      setToast(message)
      toastTimer.current = setTimeout(() => setToast(null), 5000)
    },
    [clearToastTimer],
  )

  useEffect(() => clearToastTimer, [clearToastTimer])

  const handleAction = useCallback(
    (id: string, status: 'approved' | 'rejected') => {
      const target = items.find((i) => i.id === id)
      if (!target || target.status !== 'pending') return
      const idx = visiblePending.findIndex((i) => i.id === id)
      const next = visiblePending[idx + 1] ?? visiblePending[idx - 1] ?? null
      setLastAction({ id, prevStatus: target.status })
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
      if (editingId === id) setEditingId(null)
      setFocusedId(next?.id ?? null)
      showToast(status === 'approved' ? 'Zatwierdzono' : 'Odrzucono')
    },
    [items, visiblePending, editingId, showToast],
  )

  const handleUndo = useCallback(() => {
    if (!lastAction) return
    setItems((prev) => prev.map((i) => (i.id === lastAction.id ? { ...i, status: lastAction.prevStatus } : i)))
    setFocusedId(lastAction.id)
    setLastAction(null)
    clearToastTimer()
    setToast(null)
  }, [lastAction, clearToastTimer])

  const handleSaveReply = useCallback((id: string, reply: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, draft_reply: reply } : i)))
    setEditedIds((prev) => new Set(prev).add(id))
    setEditingId(null)
  }, [])

  const handleAdd = useCallback((item: QueueItem) => {
    setItems((prev) => [item, ...prev])
    setFocusedId(item.id)
  }, [])

  // Skróty klawiszowe — pomijane podczas edycji i pisania w polach tekstowych.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (editingId !== null || tag === 'INPUT' || tag === 'TEXTAREA') return
      if (visiblePending.length === 0) return
      const idx = visiblePending.findIndex((i) => i.id === focusedId)
      const cur = idx >= 0 ? idx : 0
      switch (e.key.toLowerCase()) {
        case 'j':
          e.preventDefault()
          setFocusedId(visiblePending[Math.min(cur + 1, visiblePending.length - 1)].id)
          break
        case 'k':
          e.preventDefault()
          setFocusedId(visiblePending[Math.max(cur - 1, 0)].id)
          break
        case 'a':
          if (focusedId) {
            e.preventDefault()
            handleAction(focusedId, 'approved')
          }
          break
        case 'r':
          if (focusedId) {
            e.preventDefault()
            handleAction(focusedId, 'rejected')
          }
          break
        case 'e':
          if (focusedId) {
            e.preventDefault()
            setEditingId(focusedId)
          }
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visiblePending, focusedId, editingId, handleAction])

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Cliqy Studio</p>
        <h1 className="text-2xl font-bold text-zinc-100">Panel weryfikacji</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          {stats.pending} oczekujących · {items.length} łącznie
          <span className="text-zinc-600"> · skróty: J/K nawigacja, A zatwierdź, R odrzuć, E edytuj</span>
        </p>
      </div>

      <StatsBar stats={stats} />
      <AddMessageForm defaultCompany={SEED_ITEMS[0].company} onAdd={handleAdd} />

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === cat ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {cat === 'all' ? 'Wszystkie' : cat}
          </button>
        ))}
      </div>

      {stats.pending === 0 && items.length > 0 && (
        <div className="mb-4 rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-4 text-center text-sm text-emerald-400">
          ✓ Wszystko obsłużone — brak wiadomości oczekujących na weryfikację.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {visible.length === 0 && (
          <p className="text-zinc-500 text-sm py-12 text-center">Brak elementów w tej kategorii.</p>
        )}

        {visible.map((item) => (
          <QueueCard
            key={item.id}
            item={item}
            focused={item.id === focusedId}
            isEditing={item.id === editingId}
            onApprove={() => handleAction(item.id, 'approved')}
            onReject={() => handleAction(item.id, 'rejected')}
            onStartEdit={() => setEditingId(item.id)}
            onSaveReply={(reply) => handleSaveReply(item.id, reply)}
            onCancelEdit={() => setEditingId(null)}
          />
        ))}
      </div>

      {toast && lastAction && <Toast message={toast} onUndo={handleUndo} onDismiss={() => setToast(null)} />}
    </main>
  )
}
