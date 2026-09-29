import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import CandidatePanels from '../components/public/CandidatePanels'
import Hero from '../components/public/Hero'
import ResultsSection from '../components/public/ResultsSection'
import Timeline from '../components/public/Timeline'
import TurnoutSection from '../components/public/TurnoutSection'
import { usePublicData } from '../components/public/usePublicData'
import Button, { Spinner } from '../components/ui/Button'
import { CANDIDATES, ELECTION } from '../config/election'
import { isSupabaseConfigured } from '../lib/supabase'
import type { PublicData } from '../lib/types'
import MockControls from '../mocks/MockControls'
import { useMockPublicData } from '../mocks/useMockPublicData'

const scrollToResults = () =>
  document.getElementById('hasil')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

function PublicView({ data, extra }: { data: PublicData; extra?: ReactNode }) {
  const { candidates, turnout, results, error, live, refresh } = data
  const status = turnout?.status ?? null
  const showResults = status === 'ditutup' && results.length > 0 && candidates

  useEffect(() => {
    document.title = ELECTION.name
  }, [])

  // Voting closing while the page is open gets the full build-up; visitors who
  // arrive later get a quick count (and can replay the full one).
  const [reveal, setReveal] = useState({ key: 0, dramatic: false })
  const [lastStatus, setLastStatus] = useState(status)
  if (status !== lastStatus) {
    setLastStatus(status)
    if (lastStatus === 'dibuka' && status === 'ditutup') setReveal((r) => ({ key: r.key + 1, dramatic: true }))
  }
  const replay = () => {
    setReveal((r) => ({ key: r.key + 1, dramatic: true }))
    scrollToResults()
  }

  // ...and bring the results into view when that happens.
  const previousStatus = useRef(status)
  useEffect(() => {
    if (previousStatus.current === 'dibuka' && status === 'ditutup') scrollToResults()
    previousStatus.current = status
  }, [status])

  const nav = [
    { href: '#linimasa', label: 'Linimasa' },
    showResults ? { href: '#hasil', label: 'Hasil' } : { href: '#partisipasi', label: 'Partisipasi' },
    { href: '#paslon', label: 'Pasangan Calon' },
  ]

  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <a href="#" className="flex items-center gap-2.5 font-display text-lg font-bold">
          <span aria-hidden className="flex gap-0.5">
            {(candidates ?? CANDIDATES).map((c) => (
              <span key={c.id} className="h-5 w-1.5 rounded-full" style={{ backgroundColor: c.accent_color }} />
            ))}
          </span>
          Pemilu Raya MPS
        </a>
        <nav aria-label="Bagian halaman" className="hidden sm:block">
          <ul className="flex gap-6 text-sm font-medium text-muted">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <Hero status={status} candidates={candidates ?? CANDIDATES} totalDpt={turnout?.total_dpt ?? null} />

        {turnout && candidates ? (
          <>
            <Timeline status={turnout.status} />
            {showResults ? (
              <ResultsSection
                key={reveal.key}
                candidates={candidates}
                results={results}
                turnout={turnout}
                dramatic={reveal.dramatic}
                onReplay={replay}
              />
            ) : (
              <TurnoutSection turnout={turnout} live={live} />
            )}
            <CandidatePanels candidates={candidates} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-24 text-center text-muted" role="status">
            {error ? (
              <>
                <p className="text-lg">Gagal memuat data pemilu. {error}</p>
                <Button variant="secondary" onClick={refresh}>
                  Coba lagi
                </Button>
              </>
            ) : (
              <>
                <Spinner className="size-8" />
                <p>Memuat data pemilu…</p>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="mt-8 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:px-6">
          <p>{ELECTION.name} · Demo portofolio, data pasangan calon dan pemilih fiktif.</p>
          <Link to="/login" className="font-medium hover:text-ink">
            Masuk staf
          </Link>
        </div>
      </footer>

      {extra}
    </div>
  )
}

function LivePublicPage() {
  return <PublicView data={usePublicData()} />
}

function MockPublicPage() {
  const { data, tie, controls } = useMockPublicData()
  return (
    <PublicView
      data={data}
      extra={<MockControls status={data.turnout!.status} tie={tie} controls={controls} />}
    />
  )
}

// Mock data when Supabase isn't configured, or in dev with ?mock in the URL.
const useMock =
  !isSupabaseConfigured || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('mock'))

export default function PublicPage() {
  return useMock ? <MockPublicPage /> : <LivePublicPage />
}
