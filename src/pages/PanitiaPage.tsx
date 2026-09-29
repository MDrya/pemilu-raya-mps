import { useEffect } from 'react'
import BoothMonitor from '../components/panitia/BoothMonitor'
import DemoTools from '../components/panitia/DemoTools'
import ElectionControl from '../components/panitia/ElectionControl'
import StatsPanel from '../components/panitia/StatsPanel'
import { usePanitiaData } from '../components/panitia/usePanitiaData'
import VoterDesk from '../components/panitia/VoterDesk'
import Button from '../components/ui/Button'
import FullPageMessage from '../components/ui/FullPageMessage'
import { ToastProvider } from '../components/ui/Toaster'
import { ELECTION } from '../config/election'
import { useAuth } from '../lib/auth'

function Dashboard() {
  const { auth, signOut } = useAuth()
  const { election, booths, turnout, integrity, error, live, version, refresh } = usePanitiaData()

  useEffect(() => {
    document.title = `Panitia — ${ELECTION.name}`
  }, [])

  if (!election || !turnout) {
    return error ? (
      <FullPageMessage title="Gagal memuat data">
        <p>{error}</p>
        <Button className="mt-4" onClick={refresh}>
          Coba lagi
        </Button>
      </FullPageMessage>
    ) : (
      <FullPageMessage title="Memuat ruang kendali…" loading />
    )
  }

  return (
    <div className="min-h-svh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">{ELECTION.title}</p>
            <h1 className="font-display text-xl font-bold">Ruang Kendali Panitia</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${live ? 'text-emerald-700' : 'text-amber-700'}`}
              title={live ? 'Pembaruan langsung aktif' : 'Menyambungkan ulang…'}
            >
              <span aria-hidden className={`size-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {live ? 'Langsung' : 'Menyambung…'}
            </span>
            <span className="hidden text-muted sm:inline">
              {auth.status === 'signed_in' && auth.user.email}
            </span>
            <Button variant="secondary" onClick={signOut}>
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-center text-sm text-red-800">
          {error} Data mungkin tidak terbaru.
        </p>
      )}

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <ElectionControl
          election={election}
          anyBoothOpen={booths.some((b) => b.status === 'terbuka')}
          onChanged={refresh}
        />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <VoterDesk booths={booths} electionStatus={election.status} version={version} onChanged={refresh} />
          <div className="grid gap-6">
            <BoothMonitor booths={booths} onChanged={refresh} />
            <StatsPanel turnout={turnout} integrity={integrity} />
            <DemoTools
              electionStatus={election.status}
              remainingVoters={
                turnout.total_dpt - turnout.voted_count - booths.filter((b) => b.status === 'terbuka').length
              }
              onChanged={refresh}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PanitiaPage() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  )
}
