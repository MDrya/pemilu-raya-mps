// Single place for editable election content: name, timeline, and candidate text.
// The database seed (supabase/seed.sql) is generated from the candidate text defined here.

import type { BoothStatus, Candidate, ElectionStatus, VoterStatus } from '../lib/types'

export const ELECTION = {
  /** Full name, used in the document title and the database. */
  name: 'PEMIRA IMDI ITB 2027',
  /** Short name for the hero heading. */
  title: 'PEMIRA IMDI 2027',
  /** Line above the hero heading. */
  school: 'IMDI ITB · “The Greatest”',
  tagline: 'Pemilihan Ketua Himpunan IMDI ITB. Pemungutan suara elektronik di bilik resmi panitia — rahasia, cepat, dan tanpa kertas.',
  /** Shown above the timeline. */
  period: 'November – Desember 2026',
  boothCount: 3,
}

export const STATUS_LABEL: Record<ElectionStatus, string> = {
  belum_dibuka: 'Belum Dibuka',
  dibuka: 'Pemungutan Suara Berlangsung',
  ditutup: 'Pemungutan Suara Ditutup',
}

export const VOTER_STATUS_LABEL: Record<VoterStatus, string> = {
  belum: 'Belum Memilih',
  di_bilik: 'Di Bilik',
  sudah: 'Sudah Memilih',
}

export const BOOTH_STATUS_LABEL: Record<BoothStatus, string> = {
  terkunci: 'Terkunci',
  terbuka: 'Terbuka',
}

export interface TimelineStage {
  title: string
  /** Display text. */
  date: string
  /** First day of the stage (YYYY-MM-DD), used to highlight it before voting opens. */
  start: string
}

export const TIMELINE: TimelineStage[] = [
  { title: 'Sosialisasi', date: '14 November 2026', start: '2026-11-14' },
  { title: 'Open Berkas', date: '20–24 November 2026', start: '2026-11-20' },
  { title: 'FPT Cakahim', date: '27 November 2026', start: '2026-11-27' },
  { title: 'Hearing & Pemungutan Suara', date: '4 Desember 2026', start: '2026-12-04' },
  { title: 'Pengumuman Hasil', date: '4 Desember 2026', start: '2026-12-04' },
]

/** Index of the voting stage in TIMELINE. */
export const VOTING_STAGE = 3

/**
 * Which timeline stage to highlight. While voting is open or closed the election
 * status decides; before that, the latest stage whose start date has passed.
 */
export function activeStage(status: ElectionStatus, today = new Date()): number {
  if (status === 'dibuka') return VOTING_STAGE
  if (status === 'ditutup') return TIMELINE.length - 1
  const todayKey = today.toLocaleDateString('sv-SE') // YYYY-MM-DD in local time
  let active = 0
  TIMELINE.forEach((stage, i) => {
    if (i < VOTING_STAGE && stage.start <= todayKey) active = i
  })
  return active
}

// Ballot options. A single candidate (calon tunggal) runs against "kotak kosong":
// the candidate is elected only with more than 50% of the votes.
// Ids are placeholders for mock data; the database assigns real ones.
export const CANDIDATES: Candidate[] = [
  {
    id: 'calon-01',
    kind: 'calon',
    nomor_urut: 1,
    ketua_nama: 'Prins Muhammad Raynor Akbar',
    wakil_nama: null,
    // PLACEHOLDER visi & misi — replace with the candidate's own text when it's ready,
    // then run `npm run seed:generate`.
    visi: 'Menjadikan IMDI ITB sebagai himpunan yang terbuka, solid, dan bergerak nyata untuk seluruh anggotanya.',
    misi: [
      'Membuka forum aspirasi rutin di setiap angkatan.',
      'Menjalankan program kerja himpunan secara transparan dengan laporan berkala.',
      'Memperkuat komunikasi antara anggota, Badan Pengurus, dan program studi.',
      'Mendorong budaya berkarya, berkolaborasi, dan berprestasi di Desain Interior ITB.',
    ],
    accent_color: '#1f6f5c',
    photo_url: null,
  },
  {
    id: 'kotak-kosong',
    kind: 'kotak_kosong',
    nomor_urut: 2,
    ketua_nama: 'Kotak Kosong',
    wakil_nama: null,
    visi: 'Pilih kotak kosong jika Anda tidak menyetujui calon tunggal. Calon tunggal hanya terpilih jika memperoleh lebih dari 50% suara; jika tidak, calon dinyatakan tidak terpilih.',
    misi: [],
    accent_color: '#4b5160',
    photo_url: null,
  },
]
