// Shapes of the data. They mirror the Supabase tables in supabase/migrations.

export type ElectionStatus = 'belum_dibuka' | 'dibuka' | 'ditutup'
export type StaffRole = 'panitia' | 'bilik'
export type VoterStatus = 'belum' | 'di_bilik' | 'sudah'
export type BoothStatus = 'terkunci' | 'terbuka'

export interface Election {
  name: string
  status: ElectionStatus
  opened_at: string | null
  closed_at: string | null
  /** false on the real voting day: Reset/Simulasi are hidden and refused. */
  demo_tools: boolean
}

export type CandidateKind = 'calon' | 'kotak_kosong'

export interface Candidate {
  id: string
  /** 'calon' = a person or pair; 'kotak_kosong' = the empty-box option. */
  kind: CandidateKind
  nomor_urut: number
  ketua_nama: string
  /** null when the candidate runs without a deputy. */
  wakil_nama: string | null
  visi: string
  misi: string[]
  accent_color: string
  photo_url: string | null
}

export interface PublicTurnout {
  total_dpt: number
  voted_count: number
  status: ElectionStatus
}

export interface Voter {
  id: string
  /** Nomor Induk Mahasiswa */
  nim: string
  angkatan: number | null
  nama: string
  status: VoterStatus
}

export interface Booth {
  id: number
  label: string
  status: BoothStatus
  unlocked_at: string | null
  /** The voter currently inside (panitia only; always null for bilik). */
  voter: Pick<Voter, 'nim' | 'nama'> | null
}

export interface Integrity {
  voters_sudah: number
  tally_total: number
  turnout_count: number
  ok: boolean
}

/** Published after voting closes; empty before that. */
export interface PublicResult {
  candidate_id: string
  vote_count: number
}

/** What the public page renders, from Supabase or from mock data. */
export interface PublicData {
  candidates: Candidate[] | null
  turnout: PublicTurnout | null
  results: PublicResult[]
  error: string | null
  live: boolean
  refresh: () => void
}
