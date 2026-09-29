import { motion } from 'motion/react'
import { ACTIVE_STAGE_BY_STATUS, TIMELINE } from '../../config/election'
import type { ElectionStatus } from '../../lib/types'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/useMediaQuery'
import { CheckIcon } from '../icons'
import SectionHeading from './SectionHeading'

type StageState = 'done' | 'active' | 'upcoming'

const spring = { type: 'spring', stiffness: 260, damping: 30 } as const

function StageDot({ state, layoutId }: { state: StageState; layoutId: string }) {
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center">
      {state === 'active' && (
        <motion.span
          layoutId={layoutId}
          transition={spring}
          className="absolute inset-0 rounded-full bg-ink/10 ring-2 ring-ink"
        />
      )}
      <span
        className={`relative flex items-center justify-center rounded-full transition-all duration-500 ${
          state === 'done'
            ? 'size-7 bg-ink text-paper'
            : state === 'active'
              ? 'size-4 bg-ink'
              : 'size-4 border-2 border-line bg-paper'
        }`}
      >
        {state === 'done' && <CheckIcon width={15} height={15} strokeWidth={3} />}
      </span>
    </span>
  )
}

function StageText({ title, date, state }: { title: string; date: string; state: StageState }) {
  return (
    <>
      <p
        className={`font-semibold text-balance transition-colors duration-500 ${
          state === 'upcoming' ? 'text-muted' : 'text-ink'
        }`}
      >
        {title}
      </p>
      <p className="mt-0.5 text-sm text-muted">{date}</p>
      {state === 'active' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 inline-block rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-paper"
        >
          Tahap saat ini
        </motion.p>
      )}
    </>
  )
}

export default function Timeline({ status }: { status: ElectionStatus }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const active = ACTIVE_STAGE_BY_STATUS[status]
  const stateOf = (i: number): StageState =>
    i < active ? 'done' : i === active ? 'active' : 'upcoming'
  const last = TIMELINE.length - 1

  return (
    <section aria-labelledby="linimasa" className="scroll-mt-8 py-16 sm:py-20">
      <SectionHeading id="linimasa" eyebrow="Agustus 2023" title="Linimasa Pemilu" />

      {isDesktop ? (
        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${TIMELINE.length}, 1fr)` }}>
          {/* Track between the first and last dot centers, filled up to the active stage. */}
          <div
            aria-hidden
            className="absolute top-[17px] h-0.5 bg-line"
            style={{ left: `calc(100% / ${TIMELINE.length * 2})`, right: `calc(100% / ${TIMELINE.length * 2})` }}
          >
            <motion.div
              className="h-full bg-ink"
              initial={false}
              animate={{ width: `${(active / last) * 100}%` }}
              transition={spring}
            />
          </div>
          {TIMELINE.map((stage, i) => (
            <li
              key={stage.title}
              aria-current={i === active ? 'step' : undefined}
              className="flex flex-col items-center px-2 text-center"
            >
              <StageDot state={stateOf(i)} layoutId="timeline-active-h" />
              <div className="mt-4">
                <StageText {...stage} state={stateOf(i)} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="relative">
          {TIMELINE.map((stage, i) => (
            <li
              key={stage.title}
              aria-current={i === active ? 'step' : undefined}
              className="relative flex gap-4 pb-8 last:pb-0"
            >
              {i < last && (
                <span
                  aria-hidden
                  className={`absolute top-9 bottom-0 left-[17px] w-0.5 transition-colors duration-500 ${
                    i < active ? 'bg-ink' : 'bg-line'
                  }`}
                />
              )}
              <StageDot state={stateOf(i)} layoutId="timeline-active-v" />
              <div className="pt-1.5">
                <StageText {...stage} state={stateOf(i)} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
