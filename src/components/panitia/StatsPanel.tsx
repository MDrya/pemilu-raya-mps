import { formatInt, formatPercent } from '../../lib/format'
import type { Integrity, PublicTurnout } from '../../lib/types'

// Turnout + integrity check. Totals only: never per-candidate counts.
export default function StatsPanel({
  turnout,
  integrity,
}: {
  turnout: PublicTurnout
  integrity: Integrity | null
}) {
  const percentage = turnout.total_dpt > 0 ? (turnout.voted_count / turnout.total_dpt) * 100 : 0

  return (
    <section aria-labelledby="statistik" className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <h2 id="statistik" className="text-sm font-semibold tracking-widest text-muted uppercase">
        Partisipasi
      </h2>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-5xl font-extrabold tabular-nums">{formatInt(turnout.voted_count)}</span>
        <span className="text-muted">dari {formatInt(turnout.total_dpt)} pemilih</span>
        <span className="ml-auto font-display text-2xl font-bold tabular-nums">{formatPercent(percentage)}%</span>
      </p>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-paper ring-1 ring-line">
        <div className="h-full rounded-full bg-ink transition-[width] duration-700" style={{ width: `${percentage}%` }} />
      </div>

      {!integrity && <p className="mt-5 text-sm text-muted">Memeriksa integritas data…</p>}
      {integrity && (
        <div
          role="status"
          className={`mt-5 rounded-xl p-4 ring-1 ${
            integrity.ok ? 'bg-emerald-50 ring-emerald-200' : 'bg-red-50 ring-red-300'
          }`}
        >
          <p className={`flex items-center gap-2 font-semibold ${integrity.ok ? 'text-emerald-800' : 'text-red-800'}`}>
            <span aria-hidden className={`size-2.5 rounded-full ${integrity.ok ? 'bg-emerald-600' : 'bg-red-600'}`} />
            {integrity.ok ? 'Integritas data: konsisten' : 'Integritas data: TIDAK konsisten'}
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
            {[
              ['Pemilih "Sudah Memilih"', integrity.voters_sudah],
              ['Total suara tercatat', integrity.tally_total],
              ['Angka partisipasi publik', integrity.turnout_count],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="font-display text-xl font-bold tabular-nums">{formatInt(value as number)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
