import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { CheckIcon } from '../icons'

export const THANKS_SECONDS = 5

export function ThanksScreen({ onDone }: { onDone: () => void }) {
  const [left, setLeft] = useState(THANKS_SECONDS)
  // Held in a ref so parent re-renders (e.g. Realtime refreshes) don't restart the countdown.
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const tick = setInterval(() => setLeft((s) => s - 1), 1000)
    const done = setTimeout(() => onDoneRef.current(), THANKS_SECONDS * 1000)
    return () => {
      clearInterval(tick)
      clearTimeout(done)
    }
  }, [])

  return (
    <div
      role="status"
      className="flex min-h-svh flex-col items-center justify-center gap-8 bg-ink px-8 text-center text-paper"
    >
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="flex size-32 items-center justify-center rounded-full bg-emerald-500 text-white"
      >
        <CheckIcon width={72} height={72} strokeWidth={2.5} />
      </motion.span>
      <div>
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">Suara Anda telah tercatat.</h1>
        <p className="mt-4 text-2xl text-paper/80 sm:text-3xl">Terima kasih telah memilih.</p>
      </div>
      <p className="text-lg text-paper/60 tabular-nums">Layar terkunci dalam {Math.max(left, 0)} detik…</p>
    </div>
  )
}

export function ErrorScreen({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div role="alert" className="flex min-h-svh flex-col items-center justify-center gap-6 bg-red-50 px-8 text-center">
      <span aria-hidden className="flex size-24 items-center justify-center rounded-full bg-red-700 font-display text-6xl font-extrabold text-white">
        !
      </span>
      <h1 className="font-display text-4xl font-extrabold text-red-900 sm:text-5xl">Terjadi kendala</h1>
      <p className="max-w-2xl text-2xl text-red-900">{message}</p>
      <p className="max-w-2xl text-2xl font-semibold text-red-900">Silakan panggil panitia.</p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-6 min-h-14 rounded-2xl bg-white px-8 text-lg font-semibold text-red-900 ring-1 ring-red-300 hover:bg-red-100"
      >
        Muat ulang status bilik
      </button>
    </div>
  )
}
