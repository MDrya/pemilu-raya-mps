import { useState } from 'react'
import { CANDIDATES } from '../config/election'
import type { ElectionStatus, PublicData, PublicResult } from '../lib/types'

const TOTAL_DPT = 400

// Splits the votes across however many options the config has. "Seri" gives the
// first two options the same count (with kotak kosong, a tie means it wins).
function mockResults(voted: number, tie: boolean): PublicResult[] {
  const weights = CANDIDATES.map((_, i) => (tie ? (i < 2 ? 1 : 0) : 1 / (i + 1.4)))
  const sum = weights.reduce((s, w) => s + w, 0)
  const counts = weights.map((w) => Math.floor((voted * w) / sum))
  const remainder = voted - counts.reduce((s, c) => s + c, 0)
  counts[tie && counts.length > 2 ? counts.length - 1 : 0] += remainder
  return CANDIDATES.map((c, i) => ({ candidate_id: c.id, vote_count: counts[i] }))
}

// Local stand-in for the public Supabase data (dev: add ?mock to the URL).
export function useMockPublicData() {
  const [status, setStatus] = useState<ElectionStatus>('dibuka')
  const [votedCount, setVotedCount] = useState(214)
  const [tie, setTie] = useState(false)

  const data: PublicData = {
    candidates: CANDIDATES,
    turnout: { total_dpt: TOTAL_DPT, voted_count: votedCount, status },
    // Like the real database: nothing per-candidate until voting closes.
    results: status === 'ditutup' ? mockResults(votedCount, tie) : [],
    error: null,
    live: true,
    refresh: () => {},
  }

  return {
    data,
    tie,
    controls: {
      setStatus,
      addVotes: (n: number) => setVotedCount((v) => Math.min(TOTAL_DPT, v + n)),
      resetVotes: () => setVotedCount(0),
      toggleTie: () => setTie((t) => !t),
    },
  }
}

export type MockControls = ReturnType<typeof useMockPublicData>['controls']
