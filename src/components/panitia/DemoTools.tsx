import { useState } from 'react'
import { formatInt } from '../../lib/format'
import { callRpc } from '../../lib/rpc'
import type { ElectionStatus } from '../../lib/types'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useToast } from '../ui/toast'

const PRESETS = [50, 150]

// Clearly separated demo tools: both go through the same server functions and rules.
export default function DemoTools({
  electionStatus,
  remainingVoters,
  onChanged,
}: {
  electionStatus: ElectionStatus
  remainingVoters: number
  onChanged: () => void
}) {
  const notify = useToast()
  const [count, setCount] = useState(50)
  const [confirming, setConfirming] = useState<'simulate' | 'reset' | null>(null)
  const [pending, setPending] = useState(false)

  const canSimulate = electionStatus === 'dibuka' && remainingVoters > 0
  const validCount = Number.isInteger(count) && count >= 1 && count <= 1000

  async function run(action: 'simulate' | 'reset') {
    setPending(true)
    try {
      if (action === 'simulate') {
        const cast = await callRpc<number>('demo_simulate', { n: count })
        notify(cast > 0 ? `${formatInt(cast)} suara simulasi tercatat.` : 'Tidak ada pemilih tersisa.')
      } else {
        await callRpc('demo_reset')
        notify('Demo direset ke kondisi awal.')
      }
      setConfirming(null)
      onChanged()
    } catch (e) {
      notify((e as Error).message, 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      aria-labelledby="mode-demo"
      className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="mode-demo" className="text-sm font-semibold tracking-widest text-amber-900 uppercase">
          Mode Demo
        </h2>
        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
          Hanya untuk demonstrasi
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        <label htmlFor="jumlah-simulasi" className="text-sm font-medium">
          Simulasikan pemilih
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="jumlah-simulasi"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            value={Number.isNaN(count) ? '' : count}
            onChange={(e) => setCount(e.target.valueAsNumber)}
            className="h-11 w-24 rounded-xl bg-white px-3 text-base tabular-nums ring-1 ring-line focus:ring-2 focus:ring-ink focus:outline-none"
          />
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className="h-11 rounded-xl bg-white px-3 text-sm font-medium ring-1 ring-line hover:bg-paper"
            >
              {n}
            </button>
          ))}
          <Button
            className="ml-auto"
            disabled={!canSimulate || !validCount}
            onClick={() => setConfirming('simulate')}
          >
            Simulasikan
          </Button>
        </div>
        <p className="text-xs text-muted">
          {electionStatus !== 'dibuka'
            ? 'Hanya bisa saat pemungutan suara berlangsung.'
            : `${formatInt(remainingVoters)} pemilih belum memilih. Suara acak dicatat lewat aturan server yang sama.`}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-amber-200 pt-4">
        <p className="text-sm text-muted">Hapus semua suara dan kembali ke awal.</p>
        <Button variant="secondary" onClick={() => setConfirming('reset')}>
          Reset Demo
        </Button>
      </div>

      <ConfirmDialog
        open={confirming === 'simulate'}
        title={`Simulasikan ${formatInt(count || 0)} pemilih?`}
        confirmLabel="Ya, Simulasikan"
        loading={pending}
        onConfirm={() => run('simulate')}
        onCancel={() => setConfirming(null)}
      >
        Pemilih acak yang belum memilih akan tercatat memberikan suara acak. Angka partisipasi naik; hasil tetap
        tersembunyi sampai pemungutan suara ditutup.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirming === 'reset'}
        title="Reset demo?"
        confirmLabel="Ya, Reset"
        tone="danger"
        loading={pending}
        onConfirm={() => run('reset')}
        onCancel={() => setConfirming(null)}
      >
        Semua suara dihapus, semua pemilih kembali “Belum Memilih”, semua bilik dikunci, dan status kembali ke
        “Belum Dibuka”. Data pemilih dan pasangan calon tetap ada.
      </ConfirmDialog>
    </section>
  )
}
