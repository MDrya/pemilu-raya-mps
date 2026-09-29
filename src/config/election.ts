// Single place for editable election content: name, timeline, and candidate text.
// The database seed (supabase/seed.sql) is generated from the candidate text defined here.

import type { BoothStatus, Candidate, ElectionStatus, VoterStatus } from '../lib/types'

export const ELECTION = {
  /** Full name, used in the document title and the database. */
  name: 'Pemilu Raya MPS MAN IC Pasuruan 2023',
  /** Short name for the hero heading. */
  title: 'Pemilu Raya MPS 2023',
  school: 'MAN Insan Cendekia Pasuruan',
  tagline: 'Pemilihan Ketua dan Wakil Ketua MPS. Pemungutan suara elektronik di bilik resmi panitia — rahasia, cepat, dan tanpa kertas.',
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

// Fictional candidate pairs. Ids are placeholders until the database exists.
export const CANDIDATES: Candidate[] = [
  {
    id: 'paslon-01',
    nomor_urut: 1,
    ketua_nama: 'Alfarizi Rahman Hakim',
    wakil_nama: 'Nadia Putri Salsabila',
    visi: 'Mewujudkan MPS yang aspiratif, transparan, dan dekat dengan seluruh siswa, sebagai jembatan yang jujur antara siswa, OSIS, dan madrasah.',
    misi: [
      'Membuka kotak aspirasi daring dan forum aspirasi bulanan di setiap angkatan.',
      'Menerbitkan laporan kerja dan anggaran organisasi setiap akhir semester.',
      'Mengawal program kerja OSIS agar tepat sasaran dan tepat waktu.',
      'Menjalin komunikasi rutin dengan pembina asrama dan wali kelas.',
    ],
    accent_color: '#1f6f5c',
    photo_url: null,
  },
  {
    id: 'paslon-02',
    nomor_urut: 2,
    ketua_nama: 'Muhammad Fathan Azzam',
    wakil_nama: 'Kayla Aurelia Rahmadani',
    visi: 'Menjadikan MPS sebagai penggerak budaya siswa yang berakhlak, disiplin, dan berprestasi di tingkat nasional.',
    misi: [
      'Menguatkan pembiasaan ibadah dan adab di lingkungan madrasah dan asrama.',
      'Mendampingi siswa yang mengikuti olimpiade, lomba riset, dan kompetisi lainnya.',
      'Menyusun tata tertib organisasi yang jelas dan ditegakkan secara adil.',
      'Mengadakan evaluasi terbuka program OSIS setiap tengah semester.',
      'Mempererat hubungan antarangkatan melalui kegiatan kakak asuh.',
    ],
    accent_color: '#b3452c',
    photo_url: null,
  },
  {
    id: 'paslon-03',
    nomor_urut: 3,
    ketua_nama: 'Raihan Dzaki Pratama',
    wakil_nama: 'Syifa Nur Azizah',
    visi: 'Membangun MPS yang kolaboratif dan inovatif, memanfaatkan teknologi untuk melayani siswa dengan lebih cepat dan terbuka.',
    misi: [
      'Mengembangkan portal informasi siswa untuk jadwal, pengumuman, dan aspirasi.',
      'Mendorong kolaborasi ekstrakurikuler lintas bidang dalam satu festival tahunan.',
      'Melatih kepemimpinan dan kemampuan berorganisasi pengurus kelas.',
      'Menjaga lingkungan madrasah yang bersih, hijau, dan ramah bagi semua.',
    ],
    accent_color: '#34489a',
    photo_url: null,
  },
]
