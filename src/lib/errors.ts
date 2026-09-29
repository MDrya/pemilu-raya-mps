// Turns Supabase / network errors into a short Indonesian message for the UI.
// Our database functions already raise Indonesian messages, so those pass through.

const KNOWN: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email atau kata sandi salah.'],
  [/email not confirmed/i, 'Akun belum dikonfirmasi. Hubungi admin.'],
  [/failed to fetch|network|load failed|fetch failed/i, 'Koneksi terputus. Periksa internet lalu coba lagi.'],
  [/permission denied|jwt|not authorized/i, 'Akses ditolak. Coba masuk ulang.'],
]

export function errorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error)
  for (const [pattern, message] of KNOWN) {
    if (pattern.test(raw)) return message
  }
  return raw || 'Terjadi kesalahan. Coba lagi.'
}
