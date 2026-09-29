import { motion } from 'motion/react'
import { ELECTION } from '../../config/election'
import { formatInt } from '../../lib/format'
import type { Candidate, ElectionStatus } from '../../lib/types'
import StatusBadge from '../StatusBadge'

export default function Hero({
  status,
  candidates,
  totalDpt,
}: {
  /** null while loading. */
  status: ElectionStatus | null
  candidates: Candidate[]
  totalDpt: number | null
}) {
  const facts = [
    { value: candidates.length, label: 'Pasangan Calon' },
    { value: totalDpt, label: 'Pemilih Terdaftar' },
    { value: ELECTION.boothCount, label: 'Bilik Suara' },
  ]

  return (
    <section aria-labelledby="hero-title" className="pt-12 pb-16 sm:pt-20 sm:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="mb-4 text-sm font-semibold tracking-widest text-muted uppercase">
          {ELECTION.school}
        </p>
        <h1
          id="hero-title"
          className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-7xl lg:text-8xl"
        >
          {ELECTION.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-muted sm:text-xl">{ELECTION.tagline}</p>
        <div className="mt-8 h-10">
          {status ? (
            <StatusBadge status={status} />
          ) : (
            <span className="inline-block h-9 w-56 animate-pulse rounded-full bg-line" aria-label="Memuat status" />
          )}
        </div>
      </motion.div>

      <dl className="mt-12 grid grid-cols-3 border-t border-line pt-6 sm:mt-16">
        {facts.map((fact, i) => (
          <div key={fact.label} className={i > 0 ? 'border-l border-line pl-4 sm:pl-8' : ''}>
            <dt className="text-xs text-muted sm:text-sm">{fact.label}</dt>
            <dd className="font-display text-3xl font-bold tabular-nums sm:text-5xl">
              {fact.value === null ? '—' : formatInt(fact.value)}
            </dd>
          </div>
        ))}
      </dl>

      {/* The three paslon accent colors as a quiet signature line. */}
      <div aria-hidden className="mt-6 flex h-1.5 overflow-hidden rounded-full">
        {candidates.map((c) => (
          <span key={c.id} className="flex-1" style={{ backgroundColor: c.accent_color }} />
        ))}
      </div>
    </section>
  )
}
