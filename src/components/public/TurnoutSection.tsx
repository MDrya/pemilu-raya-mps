import { motion } from 'motion/react'
import { formatInt, formatPercent } from '../../lib/format'
import type { PublicTurnout } from '../../lib/types'
import AnimatedNumber from '../AnimatedNumber'
import SectionHeading from './SectionHeading'

const NOTE = {
  belum_dibuka: 'Pemungutan suara belum dibuka. Angka partisipasi akan bergerak langsung begitu bilik dibuka.',
  dibuka: 'Hasil per pasangan calon akan diumumkan setelah pemungutan suara ditutup.',
  ditutup: 'Pemungutan suara telah ditutup. Ini adalah angka partisipasi akhir.',
}

function LiveIndicator({ live }: { live: boolean }) {
  if (!live) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">
        <span className="size-2 rounded-full bg-amber-500" />
        Menyambungkan ulang…
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
      <span className="relative flex size-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative size-2 rounded-full bg-emerald-600" />
      </span>
      Langsung
    </span>
  )
}

export default function TurnoutSection({ turnout, live }: { turnout: PublicTurnout; live: boolean }) {
  const { total_dpt, voted_count, status } = turnout
  const percentage = total_dpt > 0 ? (voted_count / total_dpt) * 100 : 0

  return (
    <section aria-labelledby="partisipasi" className="scroll-mt-8 py-16 sm:py-20">
      <SectionHeading
        id="partisipasi"
        eyebrow={status === 'ditutup' ? 'Partisipasi akhir' : 'Partisipasi pemilih'}
        title="Suara yang Telah Masuk"
        aside={status === 'dibuka' && <LiveIndicator live={live} />}
      />

      <div className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <p aria-live="polite" className="max-w-xl">
            <AnimatedNumber
              value={voted_count}
              format={formatInt}
              className="block font-display text-7xl leading-none font-extrabold tracking-tight tabular-nums sm:text-9xl"
            />
            <span className="mt-3 block text-lg text-muted sm:text-xl">
              dari <strong className="font-semibold text-ink">{formatInt(total_dpt)} pemilih</strong>{' '}
              telah menggunakan hak suaranya
            </span>
          </p>
          <p className="font-display text-5xl font-bold tabular-nums sm:text-6xl">
            <AnimatedNumber value={percentage} format={formatPercent} />
            <span className="text-muted">%</span>
          </p>
        </div>

        <div
          role="progressbar"
          aria-label="Persentase partisipasi pemilih"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percentage)}
          className="mt-8 h-4 overflow-hidden rounded-full bg-paper ring-1 ring-line"
        >
          <motion.div
            className="h-full rounded-full bg-ink"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <p className="mt-6 text-sm text-muted sm:text-base">{NOTE[status]}</p>
      </div>
    </section>
  )
}
