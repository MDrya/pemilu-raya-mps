import { AnimatePresence, motion } from 'motion/react'
import { STATUS_LABEL } from '../config/election'
import type { ElectionStatus } from '../lib/types'

const STYLE: Record<ElectionStatus, { badge: string; dot: string }> = {
  belum_dibuka: { badge: 'bg-white text-muted ring-line', dot: 'bg-muted/60' },
  dibuka: { badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-600' },
  ditutup: { badge: 'bg-ink text-paper ring-ink', dot: 'bg-paper' },
}

export default function StatusBadge({ status }: { status: ElectionStatus }) {
  const style = STYLE[status]
  return (
    <motion.div
      layout
      role="status"
      className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors duration-500 ${style.badge}`}
    >
      <span className="relative flex size-2.5">
        {status === 'dibuka' && (
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
        )}
        <span className={`relative size-2.5 rounded-full ${style.dot}`} />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {STATUS_LABEL[status]}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}
