import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../lib/auth'
import type { ElectionStatus } from '../../lib/types'

const HOLD_MS = 2000

const NOTE: Record<ElectionStatus, string> = {
  belum_dibuka: 'Pemungutan suara belum dibuka.',
  dibuka: 'Silakan menunggu verifikasi panitia.',
  ditutup: 'Pemungutan suara telah ditutup. Terima kasih.',
}

// Staff-only menu, opened by holding the booth label for 2 seconds.
function StaffMenu({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const item =
    'min-h-14 w-full rounded-2xl bg-white px-6 text-lg font-semibold ring-1 ring-line hover:bg-paper'

  return (
    <div role="dialog" aria-modal="true" aria-label="Menu panitia" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-6">
      <div className="grid w-full max-w-sm gap-3 rounded-3xl bg-paper p-6 shadow-2xl">
        <p className="text-center text-sm font-semibold tracking-widest text-muted uppercase">Menu panitia</p>
        <button
          type="button"
          className={item}
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen()
            else document.documentElement.requestFullscreen().catch(() => {})
            onClose()
          }}
        >
          Layar penuh
        </button>
        <button type="button" className={item} onClick={() => navigate('/bilik')}>
          Ganti nomor bilik
        </button>
        <button type="button" className={item} onClick={signOut}>
          Keluar
        </button>
        <button type="button" autoFocus className={`${item} bg-ink text-paper hover:bg-ink/85`} onClick={onClose}>
          Tutup
        </button>
      </div>
    </div>
  )
}

export default function LockedScreen({
  label,
  electionStatus,
  live,
}: {
  label: string
  electionStatus: ElectionStatus | null
  live: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const startHold = () => {
    holdTimer.current = setTimeout(() => setMenuOpen(true), HOLD_MS)
  }
  const cancelHold = () => clearTimeout(holdTimer.current)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-8 text-center">
      <span aria-hidden className="relative flex size-4">
        <span className="absolute inset-0 animate-ping rounded-full bg-ink/20 [animation-duration:2.5s]" />
        <span className="relative size-4 rounded-full bg-ink/30" />
      </span>
      <h1
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        className="font-display text-7xl font-extrabold tracking-tight sm:text-8xl"
      >
        {label}
      </h1>
      <p className="max-w-xl text-2xl text-muted sm:text-3xl">
        {NOTE[electionStatus ?? 'dibuka']}
      </p>
      {!live && <p className="fixed bottom-6 text-sm text-muted">Menyambungkan ulang…</p>}
      {menuOpen && <StaffMenu onClose={() => setMenuOpen(false)} />}
    </div>
  )
}
