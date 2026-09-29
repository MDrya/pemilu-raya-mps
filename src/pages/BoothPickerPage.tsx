import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Button from '../components/ui/Button'
import FullPageMessage from '../components/ui/FullPageMessage'
import { useAuth } from '../lib/auth'
import { errorMessage } from '../lib/errors'
import { getSupabase } from '../lib/supabase'
import type { Booth } from '../lib/types'

// Shown to a booth device after login: pick which booth this device is.
export default function BoothPickerPage() {
  const { signOut } = useAuth()
  const [booths, setBooths] = useState<Pick<Booth, 'id' | 'label'>[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSupabase()
      .from('booths')
      .select('id, label')
      .order('id')
      .then(({ data, error }) => (error ? setError(errorMessage(error)) : setBooths(data)))
  }, [])

  if (error) return <FullPageMessage title="Gagal memuat bilik">{error}</FullPageMessage>
  if (!booths) return <FullPageMessage title="Memuat…" loading />

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-bold">Perangkat ini adalah…</h1>
        <p className="mt-2 text-muted">Pilih nomor bilik untuk perangkat ini.</p>
      </div>
      <ul className="flex flex-wrap justify-center gap-4">
        {booths.map((booth) => (
          <li key={booth.id}>
            <Link
              to={`/bilik/${booth.id}`}
              className="flex size-40 items-center justify-center rounded-3xl bg-ink font-display text-3xl font-bold text-paper hover:bg-ink/85"
            >
              {booth.label}
            </Link>
          </li>
        ))}
      </ul>
      <Button variant="ghost" onClick={signOut}>
        Keluar
      </Button>
    </main>
  )
}
