import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import FullPageMessage from '../components/ui/FullPageMessage'

// Shown instead of React Router's developer error screen when a page crashes.
export default function ErrorPage() {
  const error = useRouteError()
  if (import.meta.env.DEV) console.error(error)
  const detail = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : null

  return (
    <FullPageMessage title="Terjadi kesalahan">
      <p>Halaman tidak dapat ditampilkan{detail ? ` (${detail})` : ''}. Coba muat ulang.</p>
      <div className="mt-4 flex justify-center gap-4 font-semibold">
        <button type="button" onClick={() => window.location.reload()} className="text-ink underline underline-offset-4">
          Muat ulang
        </button>
        <Link to="/" className="text-ink underline underline-offset-4">
          Ke beranda
        </Link>
      </div>
    </FullPageMessage>
  )
}
