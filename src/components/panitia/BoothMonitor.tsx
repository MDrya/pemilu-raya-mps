import { useEffect, useState } from 'react'
import { BOOTH_STATUS_LABEL } from '../../config/election'
import { formatElapsed } from '../../lib/format'
import { callRpc } from '../../lib/rpc'
import type { Booth } from '../../lib/types'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useToast } from '../ui/toast'

const SLOW_SECONDS = 180

function Elapsed({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const seconds = (now - new Date(since).getTime()) / 1000
  return (
    <span className={`tabular-nums ${seconds > SLOW_SECONDS ? 'font-semibold text-red-700' : ''}`}>
      {formatElapsed(seconds)}
    </span>
  )
}

export default function BoothMonitor({ booths, onChanged }: { booths: Booth[]; onChanged: () => void }) {
  const notify = useToast()
  const [cancelling, setCancelling] = useState<Booth | null>(null)
  const [pending, setPending] = useState(false)

  async function cancel(booth: Booth) {
    setPending(true)
    try {
      await callRpc('cancel_booth', { p_booth_id: booth.id })
      notify(`${booth.label} dikunci kembali.`)
      setCancelling(null)
      onChanged()
    } catch (e) {
      notify((e as Error).message, 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-labelledby="monitor-bilik">
      <h2 id="monitor-bilik" className="mb-3 text-sm font-semibold tracking-widest text-muted uppercase">
        Monitor bilik
      </h2>
      {booths.length === 0 && (
        <p className="rounded-2xl bg-white p-4 text-sm text-muted ring-1 ring-line">
          Belum ada bilik. Jalankan seed database untuk membuat bilik.
        </p>
      )}
      <ul className="grid gap-3">
        {booths.map((booth) => {
          const open = booth.status === 'terbuka'
          return (
            <li
              key={booth.id}
              className={`rounded-2xl p-4 ring-1 transition-colors ${
                open ? 'bg-amber-50 ring-amber-300' : 'bg-white ring-line'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-lg font-bold">{booth.label}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    open ? 'bg-amber-200 text-amber-900' : 'bg-paper text-muted ring-1 ring-line'
                  }`}
                >
                  {BOOTH_STATUS_LABEL[booth.status]}
                </span>
              </div>
              {open ? (
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-semibold">{booth.voter?.nama ?? '—'}</p>
                    <p className="text-muted">
                      NIS {booth.voter?.nis ?? '—'} · menunggu{' '}
                      {booth.unlocked_at && <Elapsed since={booth.unlocked_at} />}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => setCancelling(booth)}>
                    Batalkan
                  </Button>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted">Siap untuk pemilih berikutnya.</p>
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={cancelling !== null}
        title={`Batalkan ${cancelling?.label ?? 'bilik'}?`}
        confirmLabel="Ya, Kunci Bilik"
        tone="danger"
        loading={pending}
        onConfirm={() => cancelling && cancel(cancelling)}
        onCancel={() => setCancelling(null)}
      >
        Bilik dikunci kembali tanpa mencatat suara.{' '}
        {cancelling?.voter && (
          <>
            <strong className="text-ink">{cancelling.voter.nama}</strong> kembali berstatus Belum Memilih.
          </>
        )}
      </ConfirmDialog>
    </section>
  )
}
