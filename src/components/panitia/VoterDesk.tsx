import { useEffect, useRef, useState } from 'react'
import { VOTER_STATUS_LABEL } from '../../config/election'
import { errorMessage } from '../../lib/errors'
import { callRpc } from '../../lib/rpc'
import { getSupabase } from '../../lib/supabase'
import type { Booth, ElectionStatus, Voter, VoterStatus } from '../../lib/types'
import Button, { Spinner } from '../ui/Button'
import { useToast } from '../ui/toast'

const RESULT_LIMIT = 20

const CHIP: Record<VoterStatus, string> = {
  belum: 'bg-paper text-muted ring-1 ring-line',
  di_bilik: 'bg-amber-200 text-amber-900',
  sudah: 'bg-emerald-100 text-emerald-800',
}

async function searchVoters(term: string): Promise<Voter[]> {
  // Strip characters that have meaning in PostgREST filters / LIKE patterns.
  const clean = term.replace(/[%_,()*\\]/g, '').trim()
  if (!clean) return []
  const query = getSupabase().from('voters').select('id, nis, nama, status').order('nis').limit(RESULT_LIMIT)
  const { data, error } = await (/^\d+$/.test(clean)
    ? query.ilike('nis', `${clean}%`)
    : query.ilike('nama', `%${clean}%`))
  if (error) throw error
  return data as Voter[]
}

export default function VoterDesk({
  booths,
  electionStatus,
  version,
  onChanged,
}: {
  booths: Booth[]
  electionStatus: ElectionStatus
  /** Changes whenever dashboard data refreshes; statuses in the list are re-read. */
  version: number
  onChanged: () => void
}) {
  const notify = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Voter[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [assigningBooth, setAssigningBooth] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      if (!term.trim()) {
        setResults([])
        setSearchError(null)
        return
      }
      setSearching(true)
      try {
        const voters = await searchVoters(term)
        if (!cancelled) {
          setResults(voters)
          setSearchError(null)
        }
      } catch (e) {
        if (!cancelled) setSearchError(errorMessage(e))
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term, version])

  const canAssign = electionStatus === 'dibuka'

  async function assign(voter: Voter, booth: Booth) {
    setAssigningBooth(booth.id)
    try {
      await callRpc('assign_voter_to_booth', { p_voter_id: voter.id, p_booth_id: booth.id })
      notify(`${booth.label} dibuka untuk ${voter.nama}.`)
      // Ready for the next voter in line.
      setSelectedId(null)
      setTerm('')
      inputRef.current?.focus()
      onChanged()
    } catch (e) {
      notify((e as Error).message, 'error')
      onChanged()
    } finally {
      setAssigningBooth(null)
    }
  }

  return (
    <section aria-labelledby="verifikasi" className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      <h2 id="verifikasi" className="font-display text-2xl font-bold">
        Verifikasi Pemilih
      </h2>
      <p className="mt-1 text-sm text-muted">Cari berdasarkan NIS atau nama, pilih pemilih, lalu buka bilik.</p>

      <div className="relative mt-4">
        <label htmlFor="cari-pemilih" className="sr-only">
          Cari NIS atau nama
        </label>
        <input
          id="cari-pemilih"
          ref={inputRef}
          type="search"
          autoFocus
          autoComplete="off"
          placeholder="Contoh: 9921001 atau Aisyah"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setSelectedId(null)
          }}
          className="block w-full rounded-xl bg-paper px-4 py-3 pr-10 text-base ring-1 ring-line placeholder:text-muted/60 focus:bg-white focus:ring-2 focus:ring-ink focus:outline-none"
        />
        {searching && <Spinner className="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted" />}
      </div>

      {!canAssign && (
        <p className="mt-3 rounded-xl bg-paper px-4 py-2.5 text-sm text-muted ring-1 ring-line">
          {electionStatus === 'belum_dibuka'
            ? 'Pemungutan suara belum dibuka. Pencarian tetap bisa dipakai untuk memeriksa DPT.'
            : 'Pemungutan suara sudah ditutup.'}
        </p>
      )}
      {searchError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {searchError}
        </p>
      )}

      <ul className="mt-4 grid gap-2" aria-label="Hasil pencarian">
        {results.map((voter) => {
          const isSelected = voter.id === selectedId
          return (
            <li key={voter.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(isSelected ? null : voter.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition-colors ${
                  isSelected ? 'bg-ink text-paper ring-ink' : 'bg-white ring-line hover:bg-paper'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{voter.nama}</span>
                  <span className={`block text-sm tabular-nums ${isSelected ? 'text-paper/70' : 'text-muted'}`}>
                    NIS {voter.nis}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${CHIP[voter.status]}`}>
                  {VOTER_STATUS_LABEL[voter.status]}
                </span>
              </button>

              {isSelected && (
                <div className="mt-2 mb-2 rounded-xl bg-paper p-4 ring-1 ring-line">
                  {voter.status === 'belum' ? (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {booths.map((booth) => {
                        const busy = booth.status === 'terbuka'
                        return (
                          <Button
                            key={booth.id}
                            className="min-h-12"
                            disabled={!canAssign || busy || assigningBooth !== null}
                            loading={assigningBooth === booth.id}
                            onClick={() => assign(voter, booth)}
                          >
                            {busy ? `${booth.label} · dipakai` : `Buka ${booth.label}`}
                          </Button>
                        )
                      })}
                      <p className="text-sm text-muted sm:col-span-3">
                        Buka bilik yang terkunci untuk <strong className="text-ink">{voter.nama}</strong>.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">
                      {voter.status === 'di_bilik'
                        ? 'Pemilih sedang berada di bilik. Batalkan dari monitor bilik jika perlu.'
                        : 'Pemilih sudah menggunakan hak suaranya dan tidak dapat memilih lagi.'}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {term.trim() && !searching && !searchError && results.length === 0 && (
        <p className="mt-4 text-sm text-muted">Tidak ada pemilih yang cocok dengan “{term.trim()}”.</p>
      )}
      {results.length === RESULT_LIMIT && (
        <p className="mt-3 text-xs text-muted">Menampilkan {RESULT_LIMIT} hasil pertama. Perjelas pencarian.</p>
      )}
    </section>
  )
}
