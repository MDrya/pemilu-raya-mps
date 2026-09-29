import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // One ~740 kB (≈220 kB gzip) bundle, mostly supabase-js, React, and Motion.
    // Every page needs the Supabase client, so route splitting saves little.
    chunkSizeWarningLimit: 800,
  },
})
