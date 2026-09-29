import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../../lib/errors'
import { getSupabase } from '../../lib/supabase'
import type { Candidate, PublicData, PublicResult, PublicTurnout } from '../../lib/types'

// Safety net in case a Realtime event is missed.
const POLL_MS = 30_000

// Public data only: candidates, turnout, and results (empty until voting closes;
// the database never returns per-candidate numbers before that).
export function usePublicData(): PublicData {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [turnout, setTurnout] = useState<PublicTurnout | null>(null)
  const [results, setResults] = useState<PublicResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const latestRequest = useRef(0)
  const haveCandidates = useRef(false)

  const refresh = useCallback(async () => {
    const request = ++latestRequest.current
    const supabase = getSupabase()
    try {
      const [t, r, c] = await Promise.all([
        supabase.from('public_turnout').select('total_dpt, voted_count, status').single(),
        supabase.from('public_results').select('candidate_id, vote_count'),
        haveCandidates.current
          ? null
          : supabase
              .from('candidates')
              .select('id, nomor_urut, ketua_nama, wakil_nama, visi, misi, accent_color, photo_url')
              .order('nomor_urut'),
      ])
      if (request !== latestRequest.current) return // a newer refresh is in flight
      const failed = [t, r, c].find((res) => res?.error)
      if (failed?.error) throw failed.error
      setTurnout(t.data as PublicTurnout)
      setResults(r.data as PublicResult[])
      if (c) {
        setCandidates(c.data as Candidate[])
        haveCandidates.current = true
      }
      setError(null)
    } catch (err) {
      if (request === latestRequest.current) setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabase()
    let timer: ReturnType<typeof setTimeout> | undefined
    // Coalesce bursts (closing inserts one results row per candidate).
    const schedule = (delay = 150) => {
      clearTimeout(timer)
      timer = setTimeout(refresh, delay)
    }

    const channel = supabase
      .channel(`public-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_turnout' }, () => schedule())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_results' }, () => schedule())
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED')
        if (status === 'SUBSCRIBED') schedule()
      })

    const onVisible = () => document.visibilityState === 'visible' && schedule()
    const onOnline = () => schedule()
    const poll = setInterval(refresh, POLL_MS)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    schedule(0)

    return () => {
      clearTimeout(timer)
      clearInterval(poll)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return { candidates, turnout, results, error, live, refresh }
}
