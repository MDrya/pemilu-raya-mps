import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { AREA_BY_ROLE, useAuth } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'
import type { StaffRole } from '../lib/types'
import Button from './ui/Button'
import FullPageMessage from './ui/FullPageMessage'

// Route guard: renders children only for a signed-in user with `role`.
export default function RequireRole({ role, children }: { role: StaffRole; children: ReactNode }) {
  const { auth, signOut } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) {
    return (
      <FullPageMessage title="Supabase belum dikonfigurasi">
        Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di <code>.env.local</code>.
      </FullPageMessage>
    )
  }

  if (auth.status === 'loading') return <FullPageMessage title="Memuat…" loading />

  if (auth.status === 'signed_out') {
    const next = encodeURIComponent(location.pathname)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (auth.role === role) return children

  const signOutButton = (
    <Button variant="secondary" className="mt-4" onClick={signOut}>
      Keluar
    </Button>
  )

  if (auth.roleError) {
    return (
      <FullPageMessage title="Gagal memeriksa akses">
        <p>{auth.roleError}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Coba lagi
        </Button>
      </FullPageMessage>
    )
  }

  return (
    <FullPageMessage title="Akses ditolak">
      <p>
        Akun <strong className="text-ink">{auth.user.email}</strong>{' '}
        {auth.role ? `adalah akun ${auth.role}, bukan ${role}.` : 'tidak terdaftar sebagai panitia atau bilik.'}
      </p>
      <div className="flex justify-center gap-2">
        {auth.role && (
          <Link
            to={AREA_BY_ROLE[auth.role]}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-paper"
          >
            Ke halaman {auth.role}
          </Link>
        )}
        {signOutButton}
      </div>
    </FullPageMessage>
  )
}
