import type { ReactNode } from 'react'

export default function SectionHeading({
  id,
  eyebrow,
  title,
  aside,
}: {
  id: string
  eyebrow: string
  title: string
  aside?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
      <div>
        <p className="mb-2 text-sm font-semibold tracking-widest text-muted uppercase">{eyebrow}</p>
        <h2 id={id} className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  )
}
