import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import Button from '../components/ui/Button'
import FullPageMessage from '../components/ui/FullPageMessage'
import { ELECTION } from '../config/election'
import { AREA_BY_ROLE, useAuth } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'
import type { StaffRole } from '../lib/types'

/** Only follow ?next= when it points inside the role's own area. */
function destination(role: StaffRole, next: string | null) {
  const area = AREA_BY_ROLE[role]
  if (next && (next === area || next.startsWith(`${area}/`))) return next
  return area
}

const input =
  'mt-1.5 block w-full rounded-xl bg-white px-4 py-3 text-base ring-1 ring-line placeholder:text-muted/60 focus:ring-2 focus:ring-ink focus:outline-none'

export default function LoginPage() {
  const { auth, signIn, signOut } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = `Masuk — ${ELECTION.name}`
  }, [])

  if (!isSupabaseConfigured) {
    return <FullPageMessage title="Supabase belum dikonfigurasi">Isi .env.local terlebih dahulu.</FullPageMessage>
  }
  if (auth.status === 'loading') return <FullPageMessage title="Memuat…" loading />

  if (auth.status === 'signed_in') {
    if (auth.role) return <Navigate to={destination(auth.role, params.get('next'))} replace />
    return (
      <FullPageMessage title={auth.roleError ? 'Gagal memeriksa akses' : 'Akun tidak memiliki akses'}>
        <p>
          {auth.roleError ?? (
            <>
              <strong className="text-ink">{auth.user.email}</strong> tidak terdaftar sebagai panitia atau bilik.
            </>
          )}
        </p>
        <Button variant="secondary" className="mt-4" onClick={signOut}>
          Keluar
        </Button>
      </FullPageMessage>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      // Redirect happens once the role has loaded.
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-sm font-semibold tracking-widest text-muted uppercase">{ELECTION.title}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Masuk Staf</h1>
        <p className="mt-2 text-muted">Untuk panitia dan perangkat bilik suara.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4" noValidate>
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
            />
          </label>
          <label className="block text-sm font-medium">
            Kata sandi
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
            />
          </label>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
              {error}
            </p>
          )}
          <Button type="submit" loading={submitting} disabled={!email || !password} className="mt-2 min-h-12">
            Masuk
          </Button>
        </form>

        <Link to="/" className="mt-8 inline-block text-sm font-medium text-muted hover:text-ink">
          ← Kembali ke halaman publik
        </Link>
      </div>
    </main>
  )
}
