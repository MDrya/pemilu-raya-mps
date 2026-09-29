import { STATUS_LABEL } from '../config/election'
import type { ElectionStatus } from '../lib/types'
import type { MockControls as Controls } from './useMockPublicData'

const STATUSES: ElectionStatus[] = ['belum_dibuka', 'dibuka', 'ditutup']

// Dev-only floating panel to preview each state of the public page with mock data.
export default function MockControls({
  status,
  tie,
  controls,
}: {
  status: ElectionStatus
  tie: boolean
  controls: Controls
}) {
  const button =
    'rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 ring-line hover:bg-paper aria-pressed:bg-ink aria-pressed:text-paper aria-pressed:ring-ink'
  return (
    <aside className="fixed right-4 bottom-4 z-50 w-64 rounded-xl bg-white p-3 text-ink shadow-lg ring-1 ring-line">
      <p className="mb-2 text-[11px] font-semibold tracking-widest text-muted uppercase">
        Mock data (dev)
      </p>
      <div className="mb-2 flex flex-col gap-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            className={`${button} text-left`}
            onClick={() => controls.setStatus(s)}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <button type="button" className={button} onClick={() => controls.addVotes(1)}>
          +1
        </button>
        <button type="button" className={button} onClick={() => controls.addVotes(25)}>
          +25
        </button>
        <button type="button" className={button} onClick={controls.resetVotes}>
          Nol
        </button>
        <button type="button" aria-pressed={tie} className={button} onClick={controls.toggleTie}>
          Seri
        </button>
      </div>
    </aside>
  )
}
