'use client'

import { useState } from 'react'
import type { QueueItem } from '@/types'
import { CATEGORY_STYLES, PRIORITY_DOT } from '@/lib/ui'
import { confidenceBand } from '@/lib/queue'

interface QueueCardProps {
  item: QueueItem
  focused: boolean
  isEditing: boolean
  onApprove: () => void
  onReject: () => void
  onStartEdit: () => void
  onSaveReply: (reply: string) => void
  onCancelEdit: () => void
}

const BAND_ACCENT: Record<string, string> = {
  low: 'border-l-2 border-l-red-500/70',
  mid: '',
  high: '',
}

function reviewReason(item: QueueItem): string {
  const band = confidenceBand(item.confidence)
  if (band === 'low') return 'Niska pewność AI — zweryfikuj kategorię i draft przed wysyłką'
  if (item.priority === 'high') return 'Wysoki priorytet — wymaga szybkiej reakcji'
  return 'Standardowa weryfikacja'
}

function BandTag({ confidence }: { confidence: number }) {
  const band = confidenceBand(confidence)
  if (band === 'low')
    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-700/40">⚠ wymaga uwagi</span>
  if (band === 'high')
    return <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">AI pewny</span>
  return null
}

export function QueueCard({
  item,
  focused,
  isEditing,
  onApprove,
  onReject,
  onStartEdit,
  onSaveReply,
  onCancelEdit,
}: QueueCardProps) {
  const [draft, setDraft] = useState(item.draft_reply)
  const pending = item.status === 'pending'

  return (
    <article
      className={`rounded-xl border p-5 transition-all ${pending ? '' : 'opacity-50'} ${BAND_ACCENT[confidenceBand(item.confidence)]} ${
        focused ? 'ring-2 ring-white/70' : ''
      }`}
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[item.category]}`}>
            {item.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[item.priority]}`} />
            {item.priority}
          </span>
          <BandTag confidence={item.confidence} />
          <span className="text-xs text-zinc-600">{item.company}</span>
        </div>
        <span className="text-xs text-zinc-600 shrink-0" suppressHydrationWarning>
          {new Date(item.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {pending && <p className="text-xs text-zinc-500 mb-3 italic">{reviewReason(item)}</p>}

      <div className="mb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Wiadomość</p>
        <p className="text-sm text-zinc-200">{item.message}</p>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
          Draft AI · {Math.round(item.confidence * 100)}% pewności
        </p>
        {isEditing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            autoFocus
            className="w-full mt-1 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-y"
          />
        ) : (
          <p className="text-sm text-zinc-300">{item.draft_reply}</p>
        )}
      </div>

      {pending && isEditing && (
        <div className="flex gap-2">
          <button
            onClick={() => onSaveReply(draft)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
          >
            💾 Zapisz
          </button>
          <button
            onClick={() => {
              setDraft(item.draft_reply)
              onCancelEdit()
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
          >
            Anuluj
          </button>
        </div>
      )}

      {pending && !isEditing && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 hover:bg-emerald-800/50 transition-colors"
          >
            ✅ Zatwierdź
          </button>
          <button
            onClick={onStartEdit}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
          >
            ✏️ Edytuj
          </button>
          <button
            onClick={onReject}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/40 hover:bg-red-800/50 transition-colors"
          >
            ❌ Odrzuć
          </button>
        </div>
      )}

      {!pending && (
        <p className="text-xs text-zinc-600 italic">
          {item.status === 'approved' ? '✅ Zatwierdzone' : '❌ Odrzucone'}
        </p>
      )}
    </article>
  )
}
