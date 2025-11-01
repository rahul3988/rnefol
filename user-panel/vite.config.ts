  import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.1.66:4000',
        changeOrigin: true,
        secure: false
      },
      // '/IMAGES': {
      //   target: 'http://192.168.1.66:4000',
      //   changeOrigin: true,
      //   secure: false
      // }
    },
    allowedHosts: [
      'localhost',
      '.ngrok.io',
      '.ngrok-free.dev',
      'subcontained-clelia-scorchingly.ngrok-free.dev'
    ]
  }
})
