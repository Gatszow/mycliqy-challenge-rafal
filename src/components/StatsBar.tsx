import type { QueueStats } from '@/lib/queue'

const CELLS: { key: keyof QueueStats; label: string; tone: string }[] = [
  { key: 'pending', label: 'oczekujące', tone: 'text-amber-400' },
  { key: 'approved', label: 'zatwierdzone', tone: 'text-emerald-400' },
  { key: 'rejected', label: 'odrzucone', tone: 'text-red-400' },
]

export function StatsBar({ stats }: { stats: QueueStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {CELLS.map((cell) => (
        <div
          key={cell.key}
          className="rounded-xl border p-3"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <p className={`text-2xl font-bold ${cell.tone}`}>{stats[cell.key]}</p>
          <p className="text-xs text-zinc-500">{cell.label}</p>
        </div>
      ))}
      <div
        className="rounded-xl border p-3"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        title="Odsetek zatwierdzonych draftów, które operator poprawił przed wysyłką (miara jakości AI)"
      >
        <p className="text-2xl font-bold text-zinc-200">{Math.round(stats.overturnRate * 100)}%</p>
        <p className="text-xs text-zinc-500">poprawione (overturn)</p>
      </div>
    </div>
  )
}
