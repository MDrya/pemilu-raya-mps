import { motion } from 'motion/react'
import { formatInt, formatNomor, formatPercent } from '../../lib/format'
import type { Candidate, PublicResult, PublicTurnout } from '../../lib/types'
import AnimatedNumber from '../AnimatedNumber'
import SectionHeading from './SectionHeading'

const ease = [0.16, 1, 0.3, 1] as const
const BAR_DELAY = 0.35
const BAR_STAGGER = 0.18

const formatVotes = (n: number) => `${formatInt(n)} suara`
const formatPct = (n: number) => `${formatPercent(n)}%`

function Outcome({ winners, total }: { winners: Candidate[]; total: number }) {
  const delay = BAR_DELAY + BAR_STAGGER * 3 + 0.6

  if (total === 0) {
    return <p className="rounded-3xl bg-white p-8 text-lg text-muted ring-1 ring-line">Tidak ada suara yang tercatat.</p>
  }

  if (winners.length > 1) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.5, ease }}
        className="rounded-3xl bg-ink p-8 text-paper sm:p-10"
      >
        <p className="text-sm font-semibold tracking-widest text-paper/70 uppercase">Hasil akhir</p>
        <p className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">Hasil Imbang</p>
        <p className="mt-3 text-lg text-paper/80">
          Paslon {winners.map((w) => formatNomor(w.nomor_urut)).join(' dan ')} memperoleh suara terbanyak yang sama.
        </p>
      </motion.div>
    )
  }

  const [winner] = winners
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease }}
      className="relative overflow-hidden rounded-3xl p-8 text-white sm:p-10"
      style={{ backgroundColor: winner.accent_color }}
    >
      <p className="text-sm font-semibold tracking-widest text-white/75 uppercase">Pasangan calon terpilih</p>
      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
        <p className="font-display text-8xl leading-[0.85] font-extrabold tabular-nums">
          {formatNomor(winner.nomor_urut)}
        </p>
        <p className="font-display text-2xl leading-tight font-bold sm:text-3xl">
          {winner.ketua_nama}
          <br />
          <span className="text-white/85">&amp; {winner.wakil_nama}</span>
        </p>
      </div>
    </motion.div>
  )
}

export default function ResultsSection({
  candidates,
  results,
  turnout,
}: {
  candidates: Candidate[]
  results: PublicResult[]
  turnout: PublicTurnout
}) {
  const votesById = new Map(results.map((r) => [r.candidate_id, r.vote_count]))
  const rows = candidates.map((c) => ({ candidate: c, votes: votesById.get(c.id) ?? 0 }))
  const total = rows.reduce((sum, r) => sum + r.votes, 0)
  const max = Math.max(0, ...rows.map((r) => r.votes))
  const winners = max > 0 ? rows.filter((r) => r.votes === max).map((r) => r.candidate) : []
  const turnoutPct = turnout.total_dpt > 0 ? (turnout.voted_count / turnout.total_dpt) * 100 : 0

  return (
    <motion.section
      aria-labelledby="hasil"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="scroll-mt-8 py-16 sm:py-20"
    >
      <SectionHeading id="hasil" eyebrow="Pemungutan suara ditutup" title="Hasil Penghitungan" />

      <div className="grid gap-6">
        <Outcome winners={winners} total={total} />

        <ol className="grid gap-5 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-10">
          {rows.map(({ candidate: c, votes }, i) => {
            const pct = total > 0 ? (votes / total) * 100 : 0
            const isWinner = winners.length === 1 && winners[0].id === c.id
            const delay = BAR_DELAY + i * BAR_STAGGER
            return (
              <li key={c.id}>
                <div className="mb-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-extrabold text-white tabular-nums"
                      style={{ backgroundColor: c.accent_color }}
                    >
                      {formatNomor(c.nomor_urut)}
                    </span>
                    <span className="leading-tight">
                      <span className="block font-semibold">{c.ketua_nama}</span>
                      <span className="block text-sm text-muted">&amp; {c.wakil_nama}</span>
                    </span>
                    {isWinner && (
                      <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-paper">Terpilih</span>
                    )}
                  </div>
                  <p className="flex items-baseline gap-3 tabular-nums">
                    <AnimatedNumber value={votes} format={formatVotes} duration={1.6} className="text-muted" />
                    <AnimatedNumber
                      value={pct}
                      format={formatPct}
                      duration={1.6}
                      className="font-display text-2xl font-bold sm:text-3xl"
                    />
                  </p>
                </div>
                <div
                  className="h-5 overflow-hidden rounded-full bg-paper ring-1 ring-line"
                  role="img"
                  aria-label={`Paslon ${formatNomor(c.nomor_urut)}: ${formatInt(votes)} suara, ${formatPercent(pct)} persen`}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: c.accent_color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay, duration: 1.4, ease }}
                  />
                </div>
              </li>
            )
          })}
        </ol>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <dt className="text-sm text-muted">Total suara</dt>
            <dd className="font-display text-4xl font-bold tabular-nums">{formatInt(total)}</dd>
          </div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <dt className="text-sm text-muted">Partisipasi akhir</dt>
            <dd className="font-display text-4xl font-bold tabular-nums">
              {formatPercent(turnoutPct)}%
              <span className="ml-2 font-sans text-base font-normal text-muted">
                {formatInt(turnout.voted_count)} dari {formatInt(turnout.total_dpt)} pemilih
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </motion.section>
  )
}
