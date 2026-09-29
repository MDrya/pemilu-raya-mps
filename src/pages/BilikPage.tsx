import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import BallotScreen from '../components/bilik/BallotScreen'
import ConfirmVote from '../components/bilik/ConfirmVote'
import LockedScreen from '../components/bilik/LockedScreen'
import { ErrorScreen, ThanksScreen } from '../components/bilik/ResultScreens'
import { useBooth } from '../components/bilik/useBooth'
import FullPageMessage from '../components/ui/FullPageMessage'
import { ELECTION } from '../config/election'
import { callRpc } from '../lib/rpc'
import type { Candidate } from '../lib/types'

type Outcome = { kind: 'thanks' } | { kind: 'error'; message: string }

// Keeps the screen awake while the kiosk page is open (where supported).
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const acquire = () => {
      if (document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return
      navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {})
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      document.removeEventListener('visibilitychange', acquire)
      lock?.release().catch(() => {})
    }
  }, [])
}

function Screen({ id, children }: { id: string; children: ReactNode }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

function Kiosk({ boothId }: { boothId: number }) {
  const { booth, candidates, electionStatus, error, live, refresh } = useBooth(boothId)
  // A choice belongs to one unlock session (identified by unlocked_at), so a
  // cancel + re-unlock by panitia never carries over a previous voter's choice.
  const [choice, setChoice] = useState<{ session: string; candidate: Candidate } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  // Synchronous guard: blocks a second tap even before React re-renders.
  const inFlight = useRef(false)

  useWakeLock()

  useEffect(() => {
    document.title = booth ? `${booth.label} — ${ELECTION.title}` : ELECTION.title
  }, [booth])

  if (booth === undefined || !candidates) {
    return error ? (
      <FullPageMessage title="Gagal memuat bilik">
        <p>{error}</p>
        <p className="mt-2">Mencoba lagi otomatis… Jika berlanjut, panggil panitia.</p>
      </FullPageMessage>
    ) : (
      <FullPageMessage title="Memuat bilik…" loading />
    )
  }

  if (booth === null) {
    return (
      <FullPageMessage title="Bilik tidak ditemukan">
        <Link to="/bilik" className="font-semibold text-ink underline underline-offset-4">
          Pilih nomor bilik
        </Link>
      </FullPageMessage>
    )
  }

  const session = booth.status === 'terbuka' ? booth.unlocked_at : null
  // While submitting, the booth may already read 'terkunci' (our own vote locked
  // it) before the response arrives; keep the dialog up until it does.
  const chosen = choice && (choice.session === session || submitting) ? choice.candidate : null

  async function castVote() {
    if (!chosen || inFlight.current) return
    inFlight.current = true
    setSubmitting(true)
    try {
      await callRpc('cast_vote', { p_booth_id: boothId, p_candidate_id: chosen.id })
      setOutcome({ kind: 'thanks' })
    } catch (e) {
      setOutcome({ kind: 'error', message: (e as Error).message })
    } finally {
      setChoice(null)
      setSubmitting(false)
      inFlight.current = false
      refresh()
    }
  }

  // Which screen to show. The outcome screens win over live booth state
  // (a successful vote locks the booth, but we still show the thank-you).
  let screen: ReactNode
  let screenId: string
  if (outcome?.kind === 'thanks') {
    screenId = 'thanks'
    screen = <ThanksScreen onDone={() => setOutcome(null)} />
  } else if (outcome?.kind === 'error') {
    screenId = 'error'
    screen = (
      <ErrorScreen
        message={outcome.message}
        onDismiss={() => {
          setOutcome(null)
          refresh()
        }}
      />
    )
  } else if (booth.status === 'terbuka' || submitting) {
    screenId = 'ballot'
    screen = (
      <BallotScreen
        label={booth.label}
        candidates={candidates}
        disabled={submitting}
        onChoose={(candidate) => session && setChoice({ session, candidate })}
      />
    )
  } else {
    screenId = 'locked'
    screen = <LockedScreen label={booth.label} electionStatus={electionStatus} live={live} />
  }

  return (
    <div className="min-h-svh select-none">
      <AnimatePresence mode="wait">
        <Screen id={screenId} key={screenId}>
          {screen}
        </Screen>
      </AnimatePresence>
      {chosen && !outcome && (
        <ConfirmVote
          candidate={chosen}
          submitting={submitting}
          onBack={() => setChoice(null)}
          onConfirm={castVote}
        />
      )}
    </div>
  )
}

export default function BilikPage() {
  const { id } = useParams()
  const boothId = Number(id)
  if (!Number.isInteger(boothId) || boothId < 1) {
    return (
      <FullPageMessage title="Bilik tidak ditemukan">
        <Link to="/bilik" className="font-semibold text-ink underline underline-offset-4">
          Pilih nomor bilik
        </Link>
      </FullPageMessage>
    )
  }
  // Keyed so switching booths starts from a clean state.
  return <Kiosk key={boothId} boothId={boothId} />
}
