import type { QueueItem } from '@/types'
import { PRIORITY_WEIGHT } from './ui'

export type ConfidenceBand = 'low' | 'mid' | 'high'

// Progi z double-threshold policy (research HITL): <0.7 wymaga uwagi, >0.9 pewny.
export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence < 0.7) return 'low'
  if (confidence < 0.9) return 'mid'
  return 'high'
}

// Pending na górze, sortowane wg priorytetu malejąco, potem najniższa pewność
// (tam uwaga operatora jest najpilniejsza). Przetworzone lądują na dole.
export function sortForTriage(items: QueueItem[]): QueueItem[] {
  return [...items].sort((a, b) => {
    const aPending = a.status === 'pending' ? 0 : 1
    const bPending = b.status === 'pending' ? 0 : 1
    if (aPending !== bPending) return aPending - bPending
    const prio = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
    if (prio !== 0) return prio
    return a.confidence - b.confidence
  })
}

export interface QueueStats {
  pending: number
  approved: number
  rejected: number
  overturnRate: number
}

// overturnRate = % zatwierdzonych draftów, które operator poprawił przed wysyłką
// (miara jakości AI — research Mavik Labs).
export function computeStats(items: QueueItem[], editedIds: Set<string>): QueueStats {
  const pending = items.filter((i) => i.status === 'pending').length
  const approvedItems = items.filter((i) => i.status === 'approved')
  const rejected = items.filter((i) => i.status === 'rejected').length
  const editedApproved = approvedItems.filter((i) => editedIds.has(i.id)).length
  const overturnRate = approvedItems.length === 0 ? 0 : editedApproved / approvedItems.length
  return { pending, approved: approvedItems.length, rejected, overturnRate }
}
