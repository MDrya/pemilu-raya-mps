import { useState } from 'react'
import { CANDIDATES } from '../config/election'
import type { ElectionStatus, PublicData, PublicResult } from '../lib/types'

const TOTAL_DPT = 400

function mockResults(voted: number, tie: boolean): PublicResult[] {
  const [a, b, c] = CANDIDATES
  const first = Math.floor(voted * 0.41)
  const second = tie ? first : Math.floor(voted * 0.35)
  return [
    { candidate_id: a.id, vote_count: tie ? first : second },
    { candidate_id: b.id, vote_count: first },
    { candidate_id: c.id, vote_count: voted - first - second },
  ]
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
