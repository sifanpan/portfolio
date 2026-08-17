import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages subpath: CI injects BASE_PATH=/<repo-name>/
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    strictPort: true,
    headers: { 'Cache-Control': 'no-store' },
  },
})
