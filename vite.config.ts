import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { audioAdminPlugin } from './vite-plugin-audio-admin'

export default defineConfig({
  plugins: [
    react(),
    audioAdminPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Frog Call Trainer',
        short_name: 'FrogCalls',
        description: 'Learn to identify frog and toad calls by ear',
        theme_color: '#1a4731',
        background_color: '#1a4731',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Only precache the app shell (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html}'],
        runtimeCaching: [
          {
            urlPattern: /\/audio\/.+\.(mp3|m4a|wav|ogg|flac|mpga)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              expiration: { maxEntries: 300 },
            },
          },
          {
            urlPattern: /\/spectrograms\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'spectrograms',
              expiration: { maxEntries: 300 },
            },
          },
          {
            urlPattern: /\/photos\/.+\.(jpg|jpeg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'photos',
              expiration: { maxEntries: 300 },
            },
          },
        ],
      },
    }),
  ],
})
