import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'localhost',
      '.ngrok.io',
      '.ngrok-free.dev',
      'subcontained-clelia-scorchingly.ngrok-free.dev'
    ]
  }
})
