import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type Tone } from './toast'

interface Toast {
  id: number
  tone: Tone
  message: string
}

const TONE: Record<Tone, string> = {
  success: 'bg-ink text-paper',
  error: 'bg-red-700 text-white',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const notify = useCallback((message: string, tone: Tone = 'success') => {
    const id = nextId.current++
    setToasts((list) => [...list, { id, tone, message }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === 'error' ? 6000 : 3500)
  }, [])

  const value = useMemo(() => notify, [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.p
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${TONE[toast.tone]}`}
            >
              {toast.message}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
