import type { ReactNode } from 'react'
import { Spinner } from './Button'

export default function FullPageMessage({
  title,
  children,
  loading = false,
}: {
  title: string
  children?: ReactNode
  loading?: boolean
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      {loading && <Spinner className="size-8 text-muted" />}
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {children && <div className="max-w-md text-muted">{children}</div>}
    </main>
  )
}
