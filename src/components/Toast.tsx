interface ToastProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

export function Toast({ message, onUndo, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-lg">
      <span className="text-sm text-zinc-200">{message}</span>
      <button
        onClick={onUndo}
        className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        Cofnij
      </button>
      <button onClick={onDismiss} className="text-zinc-500 hover:text-zinc-300 transition-colors" aria-label="Zamknij">
        ✕
      </button>
    </div>
  )
}
