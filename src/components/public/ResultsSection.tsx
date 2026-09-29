import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { formatInt, formatNomor, formatPercent } from '../../lib/format'
import type { Candidate, PublicResult, PublicTurnout } from '../../lib/types'
import SectionHeading from './SectionHeading'

const ease = [0.16, 1, 0.3, 1] as const

// Dramatic reveal (voting closed while the page was open) vs. a quick count
// for visitors who arrive after closing.
const TIMING = {
  dramatic: { introMs: 2200, countMs: 7000 },
  quick: { introMs: 0, countMs: 1800 },
}

type Phase = 'intro' | 'counting' | 'done'

// Slow start, fast middle, slow finish: the last ballots build suspense.
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * A random order in which to "count" the ballots, purely for the animation.
 * The database never stores the order votes were cast (that's part of ballot secrecy).
 */
function countingOrder(finalVotes: number[]) {
  const order = finalVotes.flatMap((votes, i) => Array<number>(votes).fill(i))
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

function useTallyAnimation(finalVotes: number[], dramatic: boolean) {
  const total = finalVotes.reduce((s, v) => s + v, 0)
  const timing = dramatic ? TIMING.dramatic : TIMING.quick
  // The count itself (numbers ticking, bars filling) plays even with "reduce motion"
  // on: it is the point of the reveal. Sliding/scaling is already disabled for those
  // users by <MotionConfig reducedMotion="user">.
  const skip = total === 0

  const [order] = useState(() => countingOrder(finalVotes))
  const [phase, setPhase] = useState<Phase>(skip ? 'done' : timing.introMs > 0 ? 'intro' : 'counting')
  const [counted, setCounted] = useState(skip ? total : 0)

  useEffect(() => {
    if (phase !== 'intro') return
    const timer = setTimeout(() => setPhase('counting'), timing.introMs)
    return () => clearTimeout(timer)
  }, [phase, timing.introMs])

  useEffect(() => {
    if (phase !== 'counting') return
    let frame = 0
    let start: number | undefined
    const tick = (now: number) => {
      start ??= now
      const t = Math.min(1, (now - start) / timing.countMs)
      setCounted(Math.round(easeInOutCubic(t) * total))
      if (t < 1) frame = requestAnimationFrame(tick)
      else setPhase('done')
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, timing.countMs, total])

  const counts = finalVotes.map(() => 0)
  for (let i = 0; i < counted; i++) counts[order[i]]++

  return { phase, counted, counts, total }
}

function Intro() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease }}
      className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-3xl bg-ink p-10 text-center text-paper"
      role="status"
    >
      <p className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Pemungutan suara telah ditutup</p>
      <p className="flex items-center gap-2 text-xl text-paper/75">
        Suara sedang dihitung
        <span aria-hidden className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-paper/75"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
      </p>
    </motion.div>
  )
}

function Outcome({ winners, total }: { winners: Candidate[]; total: number }) {
  if (total === 0) {
    return <p className="rounded-3xl bg-white p-8 text-lg text-muted ring-1 ring-line">Tidak ada suara yang tercatat.</p>
  }

  const reveal = {
    initial: { opacity: 0, y: 16, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.6, ease },
  }

  if (winners.length > 1) {
    return (
      <motion.div {...reveal} className="rounded-3xl bg-ink p-8 text-paper sm:p-10">
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
      {...reveal}
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
  dramatic,
  onReplay,
}: {
  candidates: Candidate[]
  results: PublicResult[]
  turnout: PublicTurnout
  /** Full build-up (intro + slow count). Otherwise a quick count. */
  dramatic: boolean
  onReplay: () => void
}) {
  const votesById = new Map(results.map((r) => [r.candidate_id, r.vote_count]))
  const finalVotes = candidates.map((c) => votesById.get(c.id) ?? 0)
  const { phase, counted, counts, total } = useTallyAnimation(finalVotes, dramatic)

  const done = phase === 'done'
  const max = Math.max(0, ...counts)
  const leaders = max > 0 ? counts.flatMap((v, i) => (v === max ? [i] : [])) : []
  const winners = done ? leaders.map((i) => candidates[i]) : []
  const turnoutPct = turnout.total_dpt > 0 ? (turnout.voted_count / turnout.total_dpt) * 100 : 0

  return (
    <section aria-labelledby="hasil" className="scroll-mt-8 py-16 sm:py-20">
      <SectionHeading
        id="hasil"
        eyebrow="Pemungutan suara ditutup"
        title="Hasil Penghitungan"
        aside={
          done &&
          total > 0 && (
            <button
              type="button"
              onClick={onReplay}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-muted ring-1 ring-line hover:bg-white hover:text-ink"
            >
              ↻ Putar ulang penghitungan
            </button>
          )
        }
      />

      {/* The intro gives way immediately; the tally fades in on its own. */}
      {phase === 'intro' ? (
        <Intro />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="grid gap-6"
        >
          {done ? (
            <Outcome winners={winners} total={total} />
          ) : (
            <div className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8" role="status" aria-live="off">
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-display text-2xl font-bold">Menghitung suara…</span>
                <span className="font-display text-xl font-bold tabular-nums">
                  {formatInt(counted)} <span className="text-muted">/ {formatInt(total)}</span>
                </span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper ring-1 ring-line">
                <div className="h-full rounded-full bg-ink" style={{ width: `${total ? (counted / total) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          <ol className="grid gap-5 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-10">
            {candidates.map((c, i) => {
              const votes = counts[i]
              // Share of the ballots counted so far; the bar grows toward its final share.
              const pct = counted > 0 ? (votes / counted) * 100 : 0
              const barWidth = total > 0 ? (votes / total) * 100 : 0
              const leading = !done && leaders.length === 1 && leaders[0] === i
              const isWinner = done && winners.length === 1 && winners[0].id === c.id
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
                      {leading && (
                        <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-semibold text-ink ring-1 ring-line">
                          Unggul
                        </span>
                      )}
                      {isWinner && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-paper"
                        >
                          Terpilih
                        </motion.span>
                      )}
                    </div>
                    <p className="flex items-baseline gap-3 tabular-nums">
                      <span className="text-muted">{formatInt(votes)} suara</span>
                      <span className="font-display text-2xl font-bold sm:text-3xl">{formatPercent(pct)}%</span>
                    </p>
                  </div>
                  <div
                    className="h-5 overflow-hidden rounded-full bg-paper ring-1 ring-line"
                    role="img"
                    aria-label={`Paslon ${formatNomor(c.nomor_urut)}: ${formatInt(votes)} suara`}
                  >
                    <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: c.accent_color }} />
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
        </motion.div>
      )}
    </section>
  )
}
