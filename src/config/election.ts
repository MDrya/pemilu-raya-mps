// Single place for editable election content: name, timeline, and candidate text.
// The database seed (supabase/seed.sql) is generated from the candidate text defined here.

import type { BoothStatus, Candidate, ElectionStatus, VoterStatus } from '../lib/types'

export const ELECTION = {
  /** Full name, used in the document title and the database. */
  name: 'Pemilu Raya MPS MAN IC Pasuruan 2023',
  /** Short name for the hero heading. */
  title: 'Pemilu Raya MPS 2023',
  school: 'MAN Insan Cendekia Pasuruan',
  tagline: 'Pemilihan Ketua MPS. Pemungutan suara elektronik di bilik resmi panitia — rahasia, cepat, dan tanpa kertas.',
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
  date: string
}

export const TIMELINE: TimelineStage[] = [
  { title: 'Pendaftaran Calon', date: '1–5 Agustus 2023' },
  { title: 'Verifikasi Berkas', date: '7–9 Agustus 2023' },
  { title: 'Masa Kampanye', date: '10–19 Agustus 2023' },
  { title: 'Debat Kandidat', date: '18 Agustus 2023' },
  { title: 'Masa Tenang', date: '20–22 Agustus 2023' },
  { title: 'Pemungutan Suara', date: '23 Agustus 2023' },
  { title: 'Penghitungan & Pengumuman', date: '23–24 Agustus 2023' },
]

// Timeline index highlighted for each election status (dates are in the past,
// so the active stage follows the status, not the calendar).
export const ACTIVE_STAGE_BY_STATUS: Record<ElectionStatus, number> = {
  belum_dibuka: 4,
  dibuka: 5,
  ditutup: 6,
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
    visi: 'Menjadikan MPS sebagai wadah aspirasi yang terbuka, tegas, dan bergerak nyata untuk seluruh siswa MAN IC Pasuruan.',
    misi: [
      'Membuka forum aspirasi rutin di setiap angkatan dan asrama.',
      'Mengawal program kerja OSIS secara transparan dengan laporan berkala.',
      'Memperkuat komunikasi antara siswa, pembina asrama, dan madrasah.',
      'Mendorong budaya disiplin, berakhlak, dan berprestasi di lingkungan madrasah.',
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
