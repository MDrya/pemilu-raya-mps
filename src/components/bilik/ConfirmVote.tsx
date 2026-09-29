import { useEffect, useRef } from 'react'
import { formatNomor } from '../../lib/format'
import type { Candidate } from '../../lib/types'
import { Spinner } from '../ui/Button'

export default function ConfirmVote({
  candidate,
  submitting,
  onBack,
  onConfirm,
}: {
  candidate: Candidate
  submitting: boolean
  onBack: () => void
  onConfirm: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="konfirmasi-judul"
      onCancel={(e) => {
        e.preventDefault()
        if (!submitting) onBack()
      }}
      className="m-auto w-[min(40rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/60"
    >
      <div className="h-3" style={{ backgroundColor: candidate.accent_color }} />
      <div className="p-8 sm:p-10">
        <h2 id="konfirmasi-judul" className="text-lg font-semibold tracking-widest text-muted uppercase">
          Konfirmasi pilihan
        </h2>
        <p className="mt-4 font-display text-3xl leading-snug font-bold sm:text-4xl">
          Anda memilih{' '}
          <span style={{ color: candidate.accent_color }}>Paslon {formatNomor(candidate.nomor_urut)}</span>:{' '}
          {candidate.ketua_nama} &amp; {candidate.wakil_nama}.
        </p>
        <p className="mt-4 text-xl text-muted">Pilihan tidak dapat diubah.</p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={submitting}
            onClick={onBack}
            className="min-h-16 rounded-2xl bg-white text-xl font-semibold ring-1 ring-line hover:bg-paper disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            type="button"
            disabled={submitting}
            aria-busy={submitting || undefined}
            onClick={onConfirm}
            className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-ink text-xl font-semibold text-paper hover:bg-ink/85 disabled:cursor-wait disabled:opacity-80"
          >
            {submitting ? (
              <>
                <Spinner className="size-6" /> Mencatat…
              </>
            ) : (
              'Ya, Saya Yakin'
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}
