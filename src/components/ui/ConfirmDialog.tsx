import { useEffect, useRef, type ReactNode } from 'react'
import Button from './Button'

// Modal confirmation built on the native <dialog> (focus trap + Esc for free).
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  tone?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault()
        if (!loading) onCancel()
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="font-display text-xl font-bold">
          {title}
        </h2>
        {children && <div className="mt-2 text-muted">{children}</div>}
      </div>
      <div className="flex justify-end gap-2 border-t border-line bg-paper/60 px-6 py-4">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button variant={tone} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
