'use client'

import { useState } from 'react'
import type { ClassifyResponse, QueueItem } from '@/types'

interface AddMessageFormProps {
  defaultCompany: string
  onAdd: (item: QueueItem) => void
}

export function AddMessageForm({ defaultCompany, onAdd }: AddMessageFormProps) {
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState(defaultCompany)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = message.trim().length > 0 && company.trim().length > 0 && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), company: company.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Klasyfikacja nie powiodła się.')
      const result = data as ClassifyResponse
      onAdd({
        ...result,
        id: crypto.randomUUID(),
        message: message.trim(),
        company: company.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border p-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Dodaj wiadomość → klasyfikacja AI</p>
      <input
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Nazwa firmy"
        className="w-full mb-2 rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Wklej wiadomość od klienta…"
        rows={3}
        className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-y"
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Klasyfikuję…' : 'Klasyfikuj i dodaj'}
      </button>
    </form>
  )
}
