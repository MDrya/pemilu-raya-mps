import { motion } from 'motion/react'
import { formatNomor } from '../../lib/format'
import type { Candidate } from '../../lib/types'

// The ballot: three large cards, no visi misi and no counts.
export default function BallotScreen({
  label,
  candidates,
  disabled,
  onChoose,
}: {
  label: string
  candidates: Candidate[]
  disabled: boolean
  onChoose: (candidate: Candidate) => void
}) {
  return (
    <div className="flex min-h-svh flex-col px-6 py-8 sm:px-10">
      <header className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Silakan pilih pasangan calon.</h1>
        <p className="shrink-0 text-lg font-semibold text-muted">{label}</p>
      </header>

      {candidates.length === 0 && (
        <p className="m-auto text-2xl text-muted">Belum ada pasangan calon. Silakan panggil panitia.</p>
      )}
      <ul className="grid flex-1 gap-4 sm:gap-6 md:grid-cols-3">
        {candidates.map((c, i) => {
          const nomor = formatNomor(c.nomor_urut)
          return (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex"
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChoose(c)}
                aria-label={`Pilih Paslon ${nomor}: ${c.ketua_nama} dan ${c.wakil_nama}`}
                className="flex min-h-56 w-full flex-col justify-between rounded-3xl p-8 text-left text-white shadow-sm transition-transform select-none focus-visible:outline-4 focus-visible:outline-offset-4 active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: c.accent_color, outlineColor: c.accent_color }}
              >
                <span>
                  <span className="block text-base font-semibold tracking-widest text-white/75 uppercase">Paslon</span>
                  <span className="block font-display text-8xl leading-none font-extrabold tabular-nums sm:text-9xl">
                    {nomor}
                  </span>
                </span>
                <span className="mt-8 grid gap-3">
                  <span>
                    <span className="block text-sm font-semibold tracking-widest text-white/75 uppercase">Ketua</span>
                    <span className="block font-display text-2xl leading-tight font-bold sm:text-3xl">{c.ketua_nama}</span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold tracking-widest text-white/75 uppercase">Wakil</span>
                    <span className="block font-display text-2xl leading-tight font-bold sm:text-3xl">{c.wakil_nama}</span>
                  </span>
                </span>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
