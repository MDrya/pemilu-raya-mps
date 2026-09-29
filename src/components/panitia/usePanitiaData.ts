import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../../lib/errors'
import { getSupabase } from '../../lib/supabase'
import type { Booth, Election, Integrity, PublicTurnout } from '../../lib/types'

type OneOrMany<T> = T | T[] | null

// PostgREST embeds one-to-one / many-to-one relations as objects, but the
// untyped client can't know that, so accept either shape.
const one = <T,>(value: OneOrMany<T>): T | null => (Array.isArray(value) ? (value[0] ?? null) : value)

interface BoothRow extends Omit<Booth, 'voter'> {
  booth_assignments: OneOrMany<{ voters: OneOrMany<NonNullable<Booth['voter']>> }>
}

function toBooth({ booth_assignments, ...booth }: BoothRow): Booth {
  const assignment = one(booth_assignments)
  return { ...booth, voter: assignment ? one(assignment.voters) : null }
}

// Everything the control room shows, kept fresh via Realtime.
export function usePanitiaData() {
  const [election, setElection] = useState<Election | null>(null)
  const [booths, setBooths] = useState<Booth[]>([])
  const [turnout, setTurnout] = useState<PublicTurnout | null>(null)
  const [integrity, setIntegrity] = useState<Integrity | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  /** Increments after every successful refresh, so dependent views can refetch. */
  const [version, setVersion] = useState(0)
  const latestRequest = useRef(0)

  const refresh = useCallback(async () => {
    const request = ++latestRequest.current
    const supabase = getSupabase()
    try {
      const [e, b, t, i] = await Promise.all([
        supabase.from('election').select('name, status, opened_at, closed_at').single(),
        supabase
          .from('booths')
          .select('id, label, status, unlocked_at, booth_assignments(voters(nis, nama))')
          .order('id'),
        supabase.from('public_turnout').select('total_dpt, voted_count, status').single(),
        supabase.rpc('get_integrity').single(),
      ])
      if (request !== latestRequest.current) return // a newer refresh is in flight
      const failed = [e, b, t, i].find((r) => r.error)
      if (failed?.error) throw failed.error
      setElection(e.data as Election)
      setBooths((b.data as unknown as BoothRow[]).map(toBooth))
      setTurnout(t.data as PublicTurnout)
      setIntegrity(i.data as Integrity)
      setError(null)
      setVersion((v) => v + 1)
    } catch (err) {
      if (request === latestRequest.current) setError(errorMessage(err))
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabase()
    let timer: ReturnType<typeof setTimeout> | undefined
    // Coalesce bursts (a vote touches booths and turnout in one transaction).
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(refresh, 150)
    }

    const channel = supabase
      .channel(`panitia-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booths' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_turnout' }, schedule)
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED')
        // (Re)subscribed: catch up on anything missed while disconnected.
        if (status === 'SUBSCRIBED') schedule()
      })

    const onVisible = () => document.visibilityState === 'visible' && schedule()
    window.addEventListener('online', schedule)
    document.addEventListener('visibilitychange', onVisible)
    schedule()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('online', schedule)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return { election, booths, turnout, integrity, error, live, version, refresh }
}
