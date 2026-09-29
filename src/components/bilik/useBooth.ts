import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../../lib/errors'
import { getSupabase } from '../../lib/supabase'
import type { Booth, Candidate, ElectionStatus } from '../../lib/types'

export type BoothState = Omit<Booth, 'voter'>

// Safety net in case a Realtime event is missed: the kiosk re-reads its state.
const POLL_MS = 10_000

// Everything the kiosk needs, always re-read from the server (reload-safe).
export function useBooth(boothId: number) {
  /** undefined = loading, null = no such booth. */
  const [booth, setBooth] = useState<BoothState | null | undefined>(undefined)
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [electionStatus, setElectionStatus] = useState<ElectionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const latestRequest = useRef(0)
  const haveCandidates = useRef(false)

  const refresh = useCallback(async () => {
    const request = ++latestRequest.current
    const supabase = getSupabase()
    try {
      const [b, t, c] = await Promise.all([
        supabase.from('booths').select('id, label, status, unlocked_at').eq('id', boothId).maybeSingle(),
        supabase.from('public_turnout').select('status').single(),
        haveCandidates.current
          ? null
          : supabase
              .from('candidates')
              .select('id, nomor_urut, ketua_nama, wakil_nama, visi, misi, accent_color, photo_url')
              .order('nomor_urut'),
      ])
      if (request !== latestRequest.current) return // a newer refresh is in flight
      const failed = [b, t, c].find((r) => r?.error)
      if (failed?.error) throw failed.error
      setBooth(b.data as BoothState | null)
      setElectionStatus((t.data as { status: ElectionStatus }).status)
      if (c) {
        setCandidates(c.data as Candidate[])
        haveCandidates.current = true
      }
      setError(null)
    } catch (err) {
      if (request === latestRequest.current) setError(errorMessage(err))
    }
  }, [boothId])

  useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel(`bilik-${boothId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'booths', filter: `id=eq.${boothId}` },
        () => refresh(),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'public_turnout' }, () => refresh())
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED')
        if (status === 'SUBSCRIBED') refresh()
      })

    const poll = setInterval(refresh, POLL_MS)
    const initial = setTimeout(refresh, 0)
    window.addEventListener('online', refresh)

    return () => {
      clearTimeout(initial)
      clearInterval(poll)
      window.removeEventListener('online', refresh)
      supabase.removeChannel(channel)
    }
  }, [boothId, refresh])

  return { booth, candidates, electionStatus, error, live, refresh }
}
