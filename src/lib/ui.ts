import type { MessageCategory, MessagePriority } from '@/types'

export const CATEGORIES: readonly MessageCategory[] = ['zamówienie', 'pytanie', 'reklamacja', 'spam']

export const CATEGORY_STYLES: Record<MessageCategory, string> = {
  zamówienie: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40',
  pytanie: 'bg-blue-900/40 text-blue-400 border border-blue-700/40',
  reklamacja: 'bg-red-900/40 text-red-400 border border-red-700/40',
  spam: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

export const PRIORITY_DOT: Record<MessagePriority, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-zinc-500',
}

// Higher = more urgent — drives queue ordering so scarce operator attention
// lands on the riskiest items first.
export const PRIORITY_WEIGHT: Record<MessagePriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
}
