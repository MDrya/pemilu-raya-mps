const integer = new Intl.NumberFormat('id-ID')
const percent = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })

export const formatInt = (n: number) => integer.format(Math.round(n))

export const formatPercent = (n: number) => percent.format(n)

/** "01", "02", ... */
export const formatNomor = (n: number) => String(n).padStart(2, '0')

/** Two-letter initials used as the photo placeholder. */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')

const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

/** Elapsed seconds as "m:ss" (or "h:mm:ss"). */
export function formatElapsed(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}
