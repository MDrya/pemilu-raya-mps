import { createContext, useContext } from 'react'

export type Tone = 'success' | 'error'

export const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null)

export function useToast() {
  const notify = useContext(ToastContext)
  if (!notify) throw new Error('useToast must be used inside <ToastProvider>')
  return notify
}
