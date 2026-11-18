import { formatNomor } from './format'
import type { Candidate } from './types'

// Wording that adapts to pairs (Paslon), a single candidate (Calon), and the
// kotak kosong option, so every screen describes options the same way.

export const isKotakKosong = (c: Candidate) => c.kind === 'kotak_kosong'

/** True when the ballot is a single candidate against kotak kosong. */
export const hasKotakKosong = (candidates: Candidate[]) => candidates.some(isKotakKosong)

/** "Paslon 01", "Calon 01", or "Kotak Kosong". */
export function optionLabel(c: Candidate) {
  if (isKotakKosong(c)) return 'Kotak Kosong'
  return `${c.wakil_nama ? 'Paslon' : 'Calon'} ${formatNomor(c.nomor_urut)}`
}

/** "Ketua & Wakil", "Ketua", or "Kotak Kosong". */
export function optionNames(c: Candidate) {
  if (isKotakKosong(c)) return 'Kotak Kosong'
  return c.wakil_nama ? `${c.ketua_nama} & ${c.wakil_nama}` : c.ketua_nama
}

/** Heading for the list of options, e.g. on the public page. */
export function candidatesHeading(candidates: Candidate[]) {
  if (hasKotakKosong(candidates)) return 'Calon Tunggal'
  return candidates.some((c) => c.wakil_nama) ? 'Pasangan Calon' : 'Calon'
}
