import { Link } from 'react-router'
import FullPageMessage from '../components/ui/FullPageMessage'

export default function NotFoundPage() {
  return (
    <FullPageMessage title="Halaman tidak ditemukan">
      <Link to="/" className="font-semibold text-ink underline underline-offset-4">
        Kembali ke beranda
      </Link>
    </FullPageMessage>
  )
}
