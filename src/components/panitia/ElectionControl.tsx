import { useState } from 'react'
import { formatDateTime } from '../../lib/format'
import { callRpc } from '../../lib/rpc'
import type { Election, ElectionStatus } from '../../lib/types'
import StatusBadge from '../StatusBadge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useToast } from '../ui/toast'

export default function ElectionControl({
  election,
  anyBoothOpen,
  onChanged,
}: {
  election: Election
  anyBoothOpen: boolean
  onChanged: () => void
}) {
  const notify = useToast()
  const [confirming, setConfirming] = useState<ElectionStatus | null>(null)
  const [pending, setPending] = useState(false)

  async function apply(next: ElectionStatus) {
    setPending(true)
    try {
      await callRpc('set_election_status', { new_status: next })
      notify(next === 'dibuka' ? 'Pemungutan suara dibuka.' : 'Pemungutan suara ditutup. Hasil diumumkan.')
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
      aria-labelledby="kendali"
      className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6"
    >
      <div className="grid gap-3">
        <h2 id="kendali" className="text-sm font-semibold tracking-widest text-muted uppercase">
          Status pemungutan suara
        </h2>
        <StatusBadge status={election.status} />
        <p className="text-sm text-muted">
          {election.opened_at ? `Dibuka ${formatDateTime(election.opened_at)}` : 'Belum pernah dibuka'}
          {election.closed_at && ` · Ditutup ${formatDateTime(election.closed_at)}`}
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        {election.status === 'belum_dibuka' && (
          <Button className="min-h-12 px-6" onClick={() => setConfirming('dibuka')}>
            Buka Pemungutan Suara
          </Button>
        )}
        {election.status === 'dibuka' && (
          <>
            <Button
              variant="danger"
              className="min-h-12 px-6"
              disabled={anyBoothOpen}
              onClick={() => setConfirming('ditutup')}
            >
              Tutup Pemungutan Suara
            </Button>
            {anyBoothOpen && (
              <p className="text-sm text-amber-800">Masih ada bilik terbuka. Tunggu atau batalkan dulu.</p>
            )}
          </>
        )}
        {election.status === 'ditutup' && (
          <p className="max-w-xs text-sm text-muted sm:text-right">
            Pemungutan suara telah ditutup dan hasil sudah tampil di halaman publik.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirming === 'dibuka'}
        title="Buka pemungutan suara?"
        confirmLabel="Ya, Buka"
        loading={pending}
        onConfirm={() => apply('dibuka')}
        onCancel={() => setConfirming(null)}
      >
        Panitia dapat mulai membuka bilik untuk pemilih. Angka partisipasi di halaman publik akan bergerak langsung.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirming === 'ditutup'}
        title="Tutup pemungutan suara?"
        confirmLabel="Ya, Tutup & Umumkan"
        tone="danger"
        loading={pending}
        onConfirm={() => apply('ditutup')}
        onCancel={() => setConfirming(null)}
      >
        Hasil per pasangan calon langsung diumumkan di halaman publik.{' '}
        <strong className="text-ink">Pemungutan suara tidak dapat dibuka kembali.</strong>
      </ConfirmDialog>
    </section>
  )
}
