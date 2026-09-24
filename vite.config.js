import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/PixaProof_EvidenceFlow/' : '/',
  publicDir: 'public-deploy',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5177',
    },
  },
})
