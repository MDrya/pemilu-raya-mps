import { motion, type Variants } from 'motion/react'
import { isKotakKosong } from '../../lib/candidates'
import { formatNomor, initials } from '../../lib/format'
import type { Candidate } from '../../lib/types'
import { EmptyBoxIcon } from '../icons'

const list: Variants = {
  hidden: {},
  visible: (delay: number) => ({ transition: { delayChildren: delay, staggerChildren: 0.07 } }),
}

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

/** The big identifier: nomor urut ("01"), or an empty box for kotak kosong. */
export function OptionMark({ candidate, className = '' }: { candidate: Candidate; className?: string }) {
  if (isKotakKosong(candidate)) {
    return (
      <span className={`inline-flex items-center leading-none ${className}`} aria-hidden>
        <EmptyBoxIcon />
      </span>
    )
  }
  return <span className={`font-display font-extrabold tabular-nums ${className}`}>{formatNomor(candidate.nomor_urut)}</span>
}

/** Placeholder "photos": overlapping initials for ketua (and wakil, if any). */
export function PairAvatars({ candidate }: { candidate: Candidate }) {
  if (isKotakKosong(candidate)) return null
  const names = [candidate.ketua_nama, candidate.wakil_nama].filter((n): n is string => Boolean(n))
  return (
    <div aria-hidden className="flex">
      {names.map((name, i) => (
        <span
          key={name}
          className={`size-12 ${i > 0 ? '-ml-2' : ''} flex items-center justify-center rounded-full font-display font-bold ring-2 ring-white/60`}
          style={{ backgroundColor: `color-mix(in srgb, ${candidate.accent_color} 78%, white)` }}
        >
          {initials(name)}
        </span>
      ))}
    </div>
  )
}

export function PairNames({ candidate }: { candidate: Candidate }) {
  const term = 'text-xs font-semibold tracking-widest text-white/70 uppercase'
  const name = 'font-display text-xl font-bold sm:text-2xl'
  if (isKotakKosong(candidate)) {
    return (
      <dl>
        <dt className={term}>Pilihan</dt>
        <dd className={name}>Kotak Kosong</dd>
      </dl>
    )
  }
  return (
    <dl className="grid gap-3">
      <div>
        <dt className={term}>{candidate.wakil_nama ? 'Calon Ketua' : 'Calon Ketua Himpunan'}</dt>
        <dd className={name}>{candidate.ketua_nama}</dd>
      </div>
      {candidate.wakil_nama && (
        <div>
          <dt className={term}>Calon Wakil Ketua</dt>
          <dd className={name}>{candidate.wakil_nama}</dd>
        </div>
      )}
    </dl>
  )
}

/** Visi paragraph and a misi list whose items stagger in (or the kotak kosong explanation). */
export function VisiMisi({ candidate, delay = 0 }: { candidate: Candidate; delay?: number }) {
  const heading = 'text-xs font-semibold tracking-widest text-white/70 uppercase'
  return (
    <>
      <div>
        <h4 className={`mb-2 ${heading}`}>{isKotakKosong(candidate) ? 'Tentang kotak kosong' : 'Visi'}</h4>
        <p className="text-base leading-relaxed text-pretty sm:text-lg">{candidate.visi}</p>
      </div>
      {candidate.misi.length > 0 && (
        <div>
          <h4 className={`mb-3 ${heading}`}>Misi</h4>
          <motion.ol className="grid gap-3" variants={list} custom={delay} initial="hidden" animate="visible">
            {candidate.misi.map((text, i) => (
              <motion.li key={text} variants={item} className="flex gap-3 leading-snug">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold tabular-nums">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-pretty">{text}</span>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      )}
    </>
  )
}
