import { motion } from 'motion/react'
import { hasKotakKosong, isKotakKosong, optionLabel, optionNames } from '../../lib/candidates'
import type { CSSProperties } from 'react'
import type { Candidate } from '../../lib/types'
import { OptionMark } from '../public/CandidateDetails'

// The ballot: one large card per option, no visi misi and no counts.
// Kotak kosong is shown with the same weight as the candidate.
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
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          {hasKotakKosong(candidates)
            ? 'Silakan pilih calon atau kotak kosong.'
            : candidates.some((c) => c.wakil_nama)
              ? 'Silakan pilih pasangan calon.'
              : 'Silakan pilih calon.'}
        </h1>
        <p className="shrink-0 text-lg font-semibold text-muted">{label}</p>
      </header>

      {candidates.length === 0 && (
        <p className="m-auto text-2xl text-muted">Belum ada calon. Silakan panggil panitia.</p>
      )}
      <ul
        className="grid flex-1 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-(--cols)"
        style={{ '--cols': `repeat(${Math.max(candidates.length, 1)}, minmax(0, 1fr))` } as CSSProperties}
      >
        {candidates.map((c, i) => {
          const kotakKosong = isKotakKosong(c)
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
                aria-label={kotakKosong ? 'Pilih Kotak Kosong' : `Pilih ${optionLabel(c)}: ${optionNames(c)}`}
                className="flex min-h-56 w-full flex-col justify-between rounded-3xl p-8 text-left text-white shadow-sm transition-transform select-none focus-visible:outline-4 focus-visible:outline-offset-4 active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: c.accent_color, outlineColor: c.accent_color }}
              >
                <span>
                  <span className="block text-base font-semibold tracking-widest text-white/75 uppercase">
                    {kotakKosong ? 'Pilihan' : c.wakil_nama ? 'Paslon' : 'Calon'}
                  </span>
                  <OptionMark candidate={c} className="block text-8xl leading-none sm:text-9xl" />
                </span>
                <span className="mt-8 grid gap-3">
                  {kotakKosong ? (
                    <span className="block font-display text-3xl leading-tight font-bold sm:text-4xl">Kotak Kosong</span>
                  ) : (
                    <>
                      <span>
                        <span className="block text-sm font-semibold tracking-widest text-white/75 uppercase">Ketua</span>
                        <span className="block font-display text-2xl leading-tight font-bold sm:text-3xl">{c.ketua_nama}</span>
                      </span>
                      {c.wakil_nama && (
                        <span>
                          <span className="block text-sm font-semibold tracking-widest text-white/75 uppercase">Wakil</span>
                          <span className="block font-display text-2xl leading-tight font-bold sm:text-3xl">{c.wakil_nama}</span>
                        </span>
                      )}
                    </>
                  )}
                </span>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
