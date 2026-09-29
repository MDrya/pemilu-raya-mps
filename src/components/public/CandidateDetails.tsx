import { motion, type Variants } from 'motion/react'
import { initials } from '../../lib/format'
import type { Candidate } from '../../lib/types'

const list: Variants = {
  hidden: {},
  visible: (delay: number) => ({ transition: { delayChildren: delay, staggerChildren: 0.07 } }),
}

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

/** Placeholder "photos": overlapping initials for ketua and wakil. */
export function PairAvatars({ candidate }: { candidate: Candidate }) {
  return (
    <div aria-hidden className="flex">
      {[candidate.ketua_nama, candidate.wakil_nama].map((name, i) => (
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
  return (
    <dl className="grid gap-3">
      <div>
        <dt className="text-xs font-semibold tracking-widest text-white/70 uppercase">Calon Ketua</dt>
        <dd className="font-display text-xl font-bold sm:text-2xl">{candidate.ketua_nama}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold tracking-widest text-white/70 uppercase">Calon Wakil Ketua</dt>
        <dd className="font-display text-xl font-bold sm:text-2xl">{candidate.wakil_nama}</dd>
      </div>
    </dl>
  )
}

/** Visi paragraph and a misi list whose items stagger in. */
export function VisiMisi({ candidate, delay = 0 }: { candidate: Candidate; delay?: number }) {
  return (
    <>
      <div>
        <h4 className="mb-2 text-xs font-semibold tracking-widest text-white/70 uppercase">Visi</h4>
        <p className="text-base leading-relaxed text-pretty sm:text-lg">{candidate.visi}</p>
      </div>
      <div>
        <h4 className="mb-3 text-xs font-semibold tracking-widest text-white/70 uppercase">Misi</h4>
        <motion.ol
          className="grid gap-3"
          variants={list}
          custom={delay}
          initial="hidden"
          animate="visible"
        >
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
    </>
  )
}
