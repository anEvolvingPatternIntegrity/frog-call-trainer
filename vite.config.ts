import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { audioAdminPlugin } from './vite-plugin-audio-admin'

export default defineConfig({
  plugins: [react(), audioAdminPlugin()],
})
