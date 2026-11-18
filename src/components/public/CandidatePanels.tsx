import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { candidatesHeading, isKotakKosong, optionLabel, optionNames } from '../../lib/candidates'
import type { Candidate } from '../../lib/types'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/useMediaQuery'
import { ArrowRightIcon, ChevronDownIcon, CloseIcon } from '../icons'
import { OptionMark, PairAvatars, PairNames, VisiMisi } from './CandidateDetails'
import SectionHeading from './SectionHeading'

type PanelMode = 'equal' | 'expanded' | 'strip'

const STRIP_WIDTH = 88
const GAP = 12
// The row is a size container, so 100cqw is its width. The expanded panel ends up
// that wide minus the other panels' strips; fixing the content at that width up
// front keeps it from reflowing while the panel grows.
const expandedContentWidth = (panelCount: number) => `calc(100cqw - ${(panelCount - 1) * (STRIP_WIDTH + GAP)}px)`
const ease = [0.16, 1, 0.3, 1] as const

const fade = {
  initial: { opacity: 0 },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

// Decorative abstract shape standing in for a photo.
function PanelShape() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-16 -bottom-16 size-80 text-white/[0.07]"
    >
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="100" r="64" fill="currentColor" />
    </svg>
  )
}

function DesktopPanel({
  candidate,
  panelCount,
  mode,
  restoreFocus,
  onOpen,
  onClose,
}: {
  candidate: Candidate
  panelCount: number
  mode: PanelMode
  /** Focus this panel's open button when it reappears (after its own close). */
  restoreFocus: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const kotakKosong = isKotakKosong(candidate)
  const label = kotakKosong ? 'Kotak Kosong' : `${optionLabel(candidate)}: ${optionNames(candidate)}`

  return (
    <motion.article
      aria-label={label}
      className="group relative min-w-0 overflow-hidden rounded-3xl text-white"
      style={{ backgroundColor: candidate.accent_color, flexBasis: STRIP_WIDTH }}
      initial={false}
      animate={{ flexGrow: mode === 'strip' ? 0 : 1 }}
      transition={{ duration: 0.6, ease }}
    >
      <PanelShape />

      <AnimatePresence initial={false}>
        {mode === 'equal' && (
          <motion.div
            key="equal"
            {...fade}
            animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.3 } }}
            className="absolute inset-0 flex flex-col justify-between p-8"
          >
            <div>
              <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
                {kotakKosong ? 'Pilihan' : candidate.wakil_nama ? 'Paslon' : 'Calon'}
              </p>
              <OptionMark candidate={candidate} className="text-8xl leading-none" />
            </div>
            <div className="grid gap-5">
              <PairAvatars candidate={candidate} />
              <PairNames candidate={candidate} />
              <p className="flex items-center gap-2 text-sm font-semibold">
                {kotakKosong ? 'Apa itu kotak kosong?' : 'Lihat visi & misi'}
                <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
              </p>
            </div>
          </motion.div>
        )}

        {mode === 'strip' && (
          <motion.div
            key="strip"
            {...fade}
            animate={{ opacity: 1, transition: { delay: 0.25, duration: 0.3 } }}
            className="absolute inset-x-0 top-8 flex justify-center"
          >
            <OptionMark candidate={candidate} className="text-4xl" />
          </motion.div>
        )}

        {mode === 'expanded' && (
          <motion.div
            key="expanded"
            {...fade}
            animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.3 } }}
            className="absolute inset-y-0 left-0 flex flex-col gap-8 p-10"
            style={{ width: expandedContentWidth(panelCount) }}
          >
            <header className="flex items-start gap-8">
              <OptionMark candidate={candidate} className="text-9xl leading-[0.8]" />
              <div className="grid gap-4 pt-1">
                <PairAvatars candidate={candidate} />
                <PairNames candidate={candidate} />
              </div>
            </header>
            <div className={`grid max-w-4xl gap-10 ${candidate.misi.length > 0 ? 'grid-cols-[1fr_1.4fr]' : 'max-w-2xl'}`}>
              <VisiMisi candidate={candidate} delay={0.45} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'expanded' ? (
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label={`Tutup ${kotakKosong ? 'penjelasan kotak kosong' : `visi misi ${optionLabel(candidate)}`}`}
          className="absolute top-5 right-5 z-10 flex size-12 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 focus-visible:outline-white"
        >
          <CloseIcon />
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          autoFocus={restoreFocus}
          aria-label={kotakKosong ? 'Lihat penjelasan kotak kosong' : `Lihat visi misi ${label}`}
          className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-white"
        />
      )}
    </motion.article>
  )
}

function DesktopPanels({ candidates }: { candidates: Candidate[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastClosed, setLastClosed] = useState<string | null>(null)
  return (
    <div className="@container flex h-[620px]" style={{ gap: GAP }}>
      {candidates.map((c) => (
        <DesktopPanel
          key={c.id}
          candidate={c}
          panelCount={candidates.length}
          mode={expanded === null ? 'equal' : expanded === c.id ? 'expanded' : 'strip'}
          restoreFocus={lastClosed === c.id}
          onOpen={() => {
            setExpanded(c.id)
            setLastClosed(null)
          }}
          onClose={() => {
            setExpanded(null)
            setLastClosed(c.id)
          }}
        />
      ))}
    </div>
  )
}

function MobileAccordion({ candidates }: { candidates: Candidate[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <ul className="grid gap-3">
      {candidates.map((c) => {
        const open = expanded === c.id
        const panelId = `pilihan-${c.nomor_urut}-detail`
        return (
          <li
            key={c.id}
            className="relative overflow-hidden rounded-2xl text-white"
            style={{ backgroundColor: c.accent_color }}
          >
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setExpanded(open ? null : c.id)}
                className="flex min-h-24 w-full items-center gap-4 p-5 text-left focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-white"
              >
                <OptionMark candidate={c} className="text-5xl" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight font-bold">{c.ketua_nama}</span>
                  {c.wakil_nama && <span className="block text-white/80">&amp; {c.wakil_nama}</span>}
                  {isKotakKosong(c) && <span className="block text-white/80">Ketuk untuk penjelasan</span>}
                </span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDownIcon width={24} height={24} />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={panelId}
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-6 border-t border-white/20 px-5 pt-5 pb-7">
                    <PairAvatars candidate={c} />
                    <VisiMisi candidate={c} delay={0.15} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}

export default function CandidatePanels({ candidates }: { candidates: Candidate[] }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  return (
    <section aria-labelledby="paslon" className="scroll-mt-8 py-16 sm:py-20">
      <SectionHeading
        id="paslon"
        eyebrow="Visi & misi"
        title={candidatesHeading(candidates)}
        aside={
          <p className="text-sm text-muted">
            {isDesktop ? 'Klik panel untuk membuka visi & misi.' : 'Ketuk untuk membuka visi & misi.'}
          </p>
        }
      />
      {candidates.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-center text-muted ring-1 ring-line">Belum ada calon.</p>
      ) : isDesktop ? (
        <DesktopPanels candidates={candidates} />
      ) : (
        <MobileAccordion candidates={candidates} />
      )}
    </section>
  )
}
